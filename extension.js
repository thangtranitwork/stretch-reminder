import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as ModalDialog from 'resource:///org/gnome/shell/ui/modalDialog.js';

import { t, getLanguage } from './i18n.js';

// ─────────────────────────────────────────────────────────────────────────────
// Fullscreen Break Overlay Class using GNOME's native ModalDialog
// ─────────────────────────────────────────────────────────────────────────────
const StretchBreakOverlay = GObject.registerClass({
    GTypeName: 'StretchBreakOverlay',
}, class StretchBreakOverlay extends ModalDialog.ModalDialog {
    _init(extension, durationSeconds, callbackOnFinished) {
        super._init({
            styleClass: 'stretch-overlay-background',
            destroyOnClose: true
        });

        this.extension = extension;
        this.durationRemaining = durationSeconds;
        this.callbackOnFinished = callbackOnFinished;

        // Customise layout style
        this.contentLayout.style_class = 'stretch-overlay-content';
        this.contentLayout.vertical = true;

        const lang = getLanguage(this.extension._settings);

        // Tiêu đề
        const title = new St.Label({
            style_class: 'stretch-title',
            text: t(lang, 'break_title')
        });
        this.contentLayout.add_child(title);

        // Gợi ý ngẫu nhiên
        const tips = t(lang, 'tips');
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        const tipLabel = new St.Label({
            style_class: 'stretch-tip',
            text: randomTip
        });
        this.contentLayout.add_child(tipLabel);

        // Số giây đếm ngược
        this.timerLabel = new St.Label({
            style_class: 'stretch-timer',
            text: `${this.durationRemaining}s`
        });
        this.contentLayout.add_child(this.timerLabel);

        // Add bottom action buttons (standard ModalDialog style)
        this.setButtons([
            {
                label: t(lang, 'skip'),
                action: () => this.closeDialog(false),
                key: Clutter.KEY_Escape
            },
            {
                label: t(lang, 'postpone'),
                action: () => this.closeDialog(true),
                key: Clutter.KEY_Return,
                default: true
            }
        ]);

        // Đếm ngược thời gian nghỉ
        this._timerId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            1,
            () => {
                this.durationRemaining--;
                if (this.durationRemaining <= 0) {
                    this.closeDialog(false);
                    return GLib.SOURCE_REMOVE;
                }
                this.timerLabel.set_text(`${this.durationRemaining}s`);
                return GLib.SOURCE_CONTINUE;
            }
        );
    }

    closeDialog(postponed = false) {
        if (this._timerId) {
            GLib.source_remove(this._timerId);
            this._timerId = null;
        }

        this.close();

        if (this.callbackOnFinished) {
            this.callbackOnFinished(postponed);
        }
    }

    destroy() {
        if (this._timerId) {
            GLib.source_remove(this._timerId);
            this._timerId = null;
        }
        if (this.timerLabel) {
            this.timerLabel.destroy();
            this.timerLabel = null;
        }
        super.destroy();
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// Extension Class
// ─────────────────────────────────────────────────────────────────────────────
export default class StretchReminder extends Extension {

    enable() {
        this._settings = this.getSettings();
        this._timeLeftSec = this._settings.get_int('work-duration') * 60;
        this._timerId = null;
        this._overlay = null;
        this._isPaused = false;

        // Trạng thái Inactivity (Idle)
        this._idleWatchId = null;
        this._activeWatchId = null;
        this._isIdle = false;

        // Thiết lập UI trên panel
        this._indicator = new PanelMenu.Button(0.0, this.metadata.name, false);
        this._panelLabel = new St.Label({
            text: '🧘 --m',
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'stretch-reminder-label'
        });
        this._indicator.add_child(this._panelLabel);

        // Menu Dropdown
        this._titleItem = new PopupMenu.PopupMenuItem('Stretch & Break Reminder', { reactive: false });
        this._indicator.menu.addMenuItem(this._titleItem);
        this._indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        this._statusItem = new PopupMenu.PopupMenuItem('Trạng thái: Hoạt động', { reactive: false });
        this._indicator.menu.addMenuItem(this._statusItem);

        this._resetItem = new PopupMenu.PopupMenuItem('Đặt lại bộ đếm');
        this._resetItem.connect('activate', () => this._resetTimer());
        this._indicator.menu.addMenuItem(this._resetItem);

        this._settingsItem = new PopupMenu.PopupMenuItem('Preferences…');
        this._settingsItem.connect('activate', () => this.openPreferences());
        this._indicator.menu.addMenuItem(this._settingsItem);

        Main.panel.addToStatusArea(this.uuid, this._indicator);

        // Lắng nghe thay đổi GSettings
        this._settingsChangedId = this._settings.connect('changed', (s, key) => {
            if (key === 'work-duration') {
                this._resetTimer();
            }
            if (key === 'idle-threshold') {
                this._setupIdleMonitor();
            }
            if (key === 'language') {
                this._updateLocale();
                this._updateUI();
            }
        });

        // Bắt đầu
        this._setupIdleMonitor();
        this._startTimer();
        this._updateLocale();
        this._updateUI();
    }

    disable() {
        this._clearTimer();
        this._clearIdleMonitor();

        if (this._overlay) {
            this._overlay.close(false);
            this._overlay = null;
        }

        if (this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = null;
        }

        if (this._panelLabel) {
            this._panelLabel.destroy();
            this._panelLabel = null;
        }

        if (this._titleItem) {
            this._titleItem.destroy();
            this._titleItem = null;
        }

        if (this._statusItem) {
            this._statusItem.destroy();
            this._statusItem = null;
        }

        if (this._resetItem) {
            this._resetItem.destroy();
            this._resetItem = null;
        }

        if (this._settingsItem) {
            this._settingsItem.destroy();
            this._settingsItem = null;
        }

        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }

        this._settings = null;
    }

    // ── Timer Logic ──────────────────────────────────────────────────────────

    _startTimer() {
        this._clearTimer();
        this._timerId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            1,
            () => {
                if (!this._isPaused && !this._isIdle && !this._overlay) {
                    this._timeLeftSec--;
                    if (this._timeLeftSec <= 0) {
                        this._triggerBreak();
                        return GLib.SOURCE_CONTINUE;
                    }
                    this._updateUI();
                }
                return GLib.SOURCE_CONTINUE;
            }
        );
    }

    _clearTimer() {
        if (this._timerId) {
            GLib.source_remove(this._timerId);
            this._timerId = null;
        }
    }

    _resetTimer() {
        const workMinutes = this._settings.get_int('work-duration');
        this._timeLeftSec = workMinutes * 60;
        this._isPaused = false;
        this._updateUI();
    }

    _postponeTimer() {
        // Lùi lại 5 phút
        this._timeLeftSec = 5 * 60;
        this._isPaused = false;
        this._updateUI();
    }

    _updateLocale() {
        const lang = getLanguage(this._settings);
        if (this._titleItem) {
            this._titleItem.label.set_text(t(lang, 'title'));
        }
        if (this._resetItem) {
            this._resetItem.label.set_text(t(lang, 'reset_timer'));
        }
        if (this._settingsItem) {
            this._settingsItem.label.set_text(t(lang, 'preferences'));
        }
    }

    _updateUI() {
        if (!this._panelLabel) return;

        const lang = getLanguage(this._settings);
        const minutes = Math.floor(this._timeLeftSec / 60);
        const seconds = this._timeLeftSec % 60;
        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        if (this._isIdle) {
            this._panelLabel.set_text(t(lang, 'panel_idle'));
            if (this._statusItem) this._statusItem.label.set_text(t(lang, 'status_idle'));
        } else if (this._isPaused) {
            this._panelLabel.set_text(t(lang, 'panel_paused'));
            if (this._statusItem) this._statusItem.label.set_text(t(lang, 'status_paused'));
        } else {
            this._panelLabel.set_text(t(lang, 'panel_working', { time: timeStr }));
            if (this._statusItem) this._statusItem.label.set_text(t(lang, 'status_active', { time: timeStr }));
        }
    }

    _triggerBreak() {
        if (this._overlay) return;

        const breakSec = this._settings.get_int('break-duration');
        this._overlay = new StretchBreakOverlay(this, breakSec, (postponed) => {
            this._overlay = null;
            if (postponed) {
                this._postponeTimer();
            } else {
                this._resetTimer();
            }
        });
        this._overlay.open();
    }

    // ── Smart Idle Monitor (Tự phát hiện khi đi ra ngoài) ─────────────────────

    _setupIdleMonitor() {
        this._clearIdleMonitor();

        const idleMonitor = global.backend.get_core_idle_monitor();
        const thresholdMs = this._settings.get_int('idle-threshold') * 60 * 1000;

        // Trạng thái Idle
        this._idleWatchId = idleMonitor.add_idle_watch(thresholdMs, () => {
            this._isIdle = true;
            this._updateUI();

            // Lắng nghe khi hoạt động trở lại
            this._activeWatchId = idleMonitor.add_user_active_watch(() => {
                this._isIdle = false;
                this._resetTimer(); // Reset hẳn bộ đếm vì coi như người dùng vừa tự nghỉ ngơi xong
                this._setupIdleMonitor(); // Thiết lập lại vòng kiểm tra
            });
        });
    }

    _clearIdleMonitor() {
        const idleMonitor = global.backend.get_core_idle_monitor();
        if (this._idleWatchId) {
            idleMonitor.remove_watch(this._idleWatchId);
            this._idleWatchId = null;
        }
        if (this._activeWatchId) {
            idleMonitor.remove_watch(this._activeWatchId);
            this._activeWatchId = null;
        }
    }
}

import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import { t, getLanguage } from './i18n.js';

export default class StretchReminderPreferences extends ExtensionPreferences {

    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        window.set_default_size(550, 420);

        const page = new Adw.PreferencesPage({
            icon_name: 'preferences-system-time-symbolic',
        });
        window.add(page);

        // ── Group: Timer settings ─────────────────────────────────────────────
        const timerGroup = new Adw.PreferencesGroup();
        page.add(timerGroup);

        const workRow = new Adw.SpinRow({
            adjustment: new Gtk.Adjustment({
                lower: 1, upper: 120,
                step_increment: 1, page_increment: 5,
                value: settings.get_int('work-duration'),
            }),
        });
        settings.bind('work-duration', workRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        timerGroup.add(workRow);

        const breakRow = new Adw.SpinRow({
            adjustment: new Gtk.Adjustment({
                lower: 10, upper: 300,
                step_increment: 10, page_increment: 30,
                value: settings.get_int('break-duration'),
            }),
        });
        settings.bind('break-duration', breakRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        timerGroup.add(breakRow);

        // ── Group: Smart features ─────────────────────────────────────────────
        const smartGroup = new Adw.PreferencesGroup();
        page.add(smartGroup);

        const idleRow = new Adw.SpinRow({
            adjustment: new Gtk.Adjustment({
                lower: 1, upper: 15,
                step_increment: 1, page_increment: 2,
                value: settings.get_int('idle-threshold'),
            }),
        });
        settings.bind('idle-threshold', idleRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        smartGroup.add(idleRow);

        // ── Group: Language ───────────────────────────────────────────────────
        const languageGroup = new Adw.PreferencesGroup();
        page.add(languageGroup);

        const languageRow = new Adw.ComboRow({
            model: new Gtk.StringList({
                strings: ['System Default / Mặc định', 'English', 'Tiếng Việt']
            }),
        });
        languageGroup.add(languageRow);

        const langKeys = ['auto', 'en', 'vi'];
        const currentLang = settings.get_string('language');
        let selectedIndex = langKeys.indexOf(currentLang);
        if (selectedIndex === -1) selectedIndex = 0;
        languageRow.selected = selectedIndex;

        languageRow.connect('notify::selected', () => {
            const index = languageRow.selected;
            settings.set_string('language', langKeys[index]);
        });

        // ── Update translations dynamically ────────────────────────────────────
        const updatePrefsStrings = () => {
            const lang = getLanguage(settings);
            page.title = t(lang, 'settings');
            timerGroup.title = t(lang, 'timer_config');
            timerGroup.description = t(lang, 'timer_config_desc');
            workRow.title = t(lang, 'work_duration');
            workRow.subtitle = t(lang, 'work_duration_desc');
            breakRow.title = t(lang, 'break_duration');
            breakRow.subtitle = t(lang, 'break_duration_desc');
            smartGroup.title = t(lang, 'smart_inactivity');
            smartGroup.description = t(lang, 'smart_inactivity_desc');
            idleRow.title = t(lang, 'idle_threshold');
            idleRow.subtitle = t(lang, 'idle_threshold_desc');
            languageGroup.title = t(lang, 'language');
            languageGroup.description = t(lang, 'language_desc');
            languageRow.title = t(lang, 'language');
            languageRow.subtitle = t(lang, 'language_desc');
        };

        const changedId = settings.connect('changed::language', updatePrefsStrings);
        window.connect('destroy', () => {
            settings.disconnect(changedId);
        });

        updatePrefsStrings();
    }
}


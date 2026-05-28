import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class StretchReminderPreferences extends ExtensionPreferences {

    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        window.set_default_size(550, 420);

        const page = new Adw.PreferencesPage({
            title: 'Settings',
            icon_name: 'preferences-system-time-symbolic',
        });
        window.add(page);

        // ── Group: Timer settings ─────────────────────────────────────────────
        const timerGroup = new Adw.PreferencesGroup({
            title: 'Timer Configuration',
            description: 'Set your focus blocks and break periods',
        });
        page.add(timerGroup);

        const workRow = new Adw.SpinRow({
            title: 'Work Duration (Minutes)',
            subtitle: 'How long to work before being prompted to stand up',
            adjustment: new Gtk.Adjustment({
                lower: 1, upper: 120,
                step_increment: 1, page_increment: 5,
                value: settings.get_int('work-duration'),
            }),
        });
        settings.bind('work-duration', workRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        timerGroup.add(workRow);

        const breakRow = new Adw.SpinRow({
            title: 'Break Duration (Seconds)',
            subtitle: 'Length of the full-screen stretching break overlay',
            adjustment: new Gtk.Adjustment({
                lower: 10, upper: 300,
                step_increment: 10, page_increment: 30,
                value: settings.get_int('break-duration'),
            }),
        });
        settings.bind('break-duration', breakRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        timerGroup.add(breakRow);

        // ── Group: Smart features ─────────────────────────────────────────────
        const smartGroup = new Adw.PreferencesGroup({
            title: 'Smart Inactivity Detection',
            description: 'Pauses timer automatically if you walk away from the computer',
        });
        page.add(smartGroup);

        const idleRow = new Adw.SpinRow({
            title: 'Idle Threshold (Minutes)',
            subtitle: 'Minutes of zero activity after which timer is paused',
            adjustment: new Gtk.Adjustment({
                lower: 1, upper: 15,
                step_increment: 1, page_increment: 2,
                value: settings.get_int('idle-threshold'),
            }),
        });
        settings.bind('idle-threshold', idleRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        smartGroup.add(idleRow);
    }
}

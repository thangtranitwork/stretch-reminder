import GLib from 'gi://GLib';

const TRANSLATIONS = {
    en: {
        // extension.js
        title: 'Stretch & Break Reminder',
        status_active: 'Status: Active ({time} left)',
        status_active_simple: 'Status: Active',
        status_paused: 'Status: Paused',
        status_idle: 'Status: Paused (Idle)',
        reset_timer: 'Reset Timer',
        preferences: 'Preferences…',
        break_title: 'TIME TO TAKE A BREAK!',
        skip: 'Skip',
        postpone: 'Postpone 5 mins',
        panel_idle: '💤 Resting',
        panel_paused: '🧘 Paused',
        panel_working: '🧘 {time}',
        tips: [
            "🧘 Stand up, stretch, and take a deep breath.",
            "👀 Look 20 feet (6 meters) away to relax your eye muscles.",
            "🔄 Roll your wrists and fingers to reduce fatigue.",
            "🙆 Shrug your shoulders up and down and rotate them gently.",
            "🚶 Take a short walk to boost blood circulation.",
            "💧 Sip some water to stay hydrated.",
            "💆 Close your eyes and relax your face."
        ],
        // prefs.js
        settings: 'Settings',
        timer_config: 'Timer Configuration',
        timer_config_desc: 'Set your focus blocks and break periods',
        work_duration: 'Work Duration (Minutes)',
        work_duration_desc: 'How long to work before being prompted to stand up',
        break_duration: 'Break Duration (Seconds)',
        break_duration_desc: 'Length of the full-screen stretching break overlay',
        smart_inactivity: 'Smart Inactivity Detection',
        smart_inactivity_desc: 'Pauses timer automatically if you walk away from the computer',
        idle_threshold: 'Idle Threshold (Minutes)',
        idle_threshold_desc: 'Minutes of zero activity after which timer is paused',
        language: 'Language',
        language_desc: 'Select display language',
        lang_auto: 'System Default',
        lang_en: 'English',
        lang_vi: 'Tiếng Việt'
    },
    vi: {
        // extension.js
        title: 'Stretch & Break Reminder',
        status_active: 'Trạng thái: Hoạt động ({time} còn lại)',
        status_active_simple: 'Trạng thái: Hoạt động',
        status_paused: 'Trạng thái: Tạm dừng',
        status_idle: 'Trạng thái: Tạm dừng (Không hoạt động)',
        reset_timer: 'Đặt lại bộ đếm',
        preferences: 'Cấu hình…',
        break_title: 'ĐÃ ĐẾN LÚC NGHỈ NGƠI!',
        skip: 'Bỏ qua',
        postpone: 'Lùi 5 phút',
        panel_idle: '💤 Nghỉ ngơi',
        panel_paused: '🧘 Tạm dừng',
        panel_working: '🧘 {time}',
        tips: [
            "🧘 Đứng dậy, vươn vai và hít thở thật sâu.",
            "👀 Nhìn ra xa 6 mét (20 feet) để thư giãn cơ mắt.",
            "🔄 Xoay khớp cổ tay và các ngón tay để giảm mỏi.",
            "🙆 Nhún vai lên xuống và xoay bả vai nhẹ nhàng.",
            "🚶 Đi bộ một vòng ngắn để kích hoạt tuần hoàn máu.",
            "💧 Uống một ngụm nước để giữ ẩm cơ thể.",
            "💆 Nhắm mắt lại và thả lỏng toàn bộ vùng mặt."
        ],
        // prefs.js
        settings: 'Cấu hình',
        timer_config: 'Cấu hình thời gian',
        timer_config_desc: 'Thiết lập chu kỳ tập trung và nghỉ ngơi',
        work_duration: 'Thời gian làm việc (Phút)',
        work_duration_desc: 'Thời gian làm việc trước khi được nhắc nhở vận động',
        break_duration: 'Thời gian nghỉ ngơi (Giây)',
        break_duration_desc: 'Thời lượng hiển thị màn hình nhắc nhở vận động',
        smart_inactivity: 'Tự động phát hiện trạng thái rảnh',
        smart_inactivity_desc: 'Tự động tạm dừng bộ đếm nếu bạn rời khỏi máy tính',
        idle_threshold: 'Thời gian chờ phát hiện (Phút)',
        idle_threshold_desc: 'Số phút không hoạt động để tạm dừng bộ đếm',
        language: 'Ngôn ngữ',
        language_desc: 'Chọn ngôn ngữ hiển thị',
        lang_auto: 'Mặc định hệ thống',
        lang_en: 'Tiếng Anh (English)',
        lang_vi: 'Tiếng Việt'
    }
};

export function getLanguage(settings) {
    const langSetting = settings ? settings.get_string('language') : 'auto';
    if (langSetting === 'auto') {
        const langs = GLib.get_language_names();
        for (const lang of langs) {
            if (lang.startsWith('vi')) {
                return 'vi';
            }
        }
        return 'en';
    }
    return langSetting;
}

export function t(lang, key, params = {}) {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
    let text = dict[key] || TRANSLATIONS.en[key] || '';
    if (typeof text === 'string') {
        for (const [k, v] of Object.entries(params)) {
            text = text.replace(`{${k}}`, v);
        }
    }
    return text;
}

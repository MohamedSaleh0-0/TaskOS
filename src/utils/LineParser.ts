import { Editor, App, TFile } from 'obsidian';

export interface ParsedLineResult {
    isTask: boolean;
    title: string;
}

export class LineParser {
    // ريجكس مخصص لالتقاط التشيك بوكس الخاص بالماركداون: "- [ ] نص المهمة"
    private static taskRegex = /^\s*-\s*\[\s*\]\s*(.*)$/;

    /**
     * تفكيك السطر الحالي ومعرفة هل هو مهمة أم سطر عادي
     * @param lineText النص الكامل للسطر الحالي
     */
    static parseLine(lineText: string): ParsedLineResult {
        const match = this.taskRegex.exec(lineText);

        if (match && match[1]) {
            return {
                isTask: true,
                title: match[1].trim()
            };
        }

        return {
            isTask: false,
            title: lineText.trim()
        };
    }

    /**
     * لوجيك البحث العكسي لجلب أقرب Heading يقع فوق مؤشر الكتابة الحالي
     * @param app كائن التطبيق الخاص بأوبسيديان للوصول للكاش
     * @param file الملف الحالي المستهدف
     * @param editor كائن المحرر لمعرفة رقم السطر الحالي
     */
    static findNearestHeading(app: App, file: TFile, editor: Editor): string | null {
        const cache = app.metadataCache.getFileCache(file);
        if (!cache || !cache.headings) return null;

        const cursorLine = editor.getCursor().line;
        let nearestHeading: string | null = null;

        // المرور على العناوين المسجلة في كاش الملف
        for (const heading of cache.headings) {
            // إذا كان العنوان يقع في سطر فوق سطر الكرسور الحالي، نحتفظ به
            if (heading.position.start.line < cursorLine) {
                nearestHeading = heading.heading;
            } else {
                // العناوين مرتبة تنازلياً، بمجرد تجاوز سطر الكرسور نتوقف عن البحث
                break;
            }
        }

        return nearestHeading;
    }
}
const FONT_URL = 'https://fonts.635262140.xyz/vfs_fonts.js';
// Cache API 缓存名：字体文件更换时递增版本号即可整体失效
const FONT_CACHE_NAME = 'pdfmake-fonts-v1';
// 会话级 memo：同一会话内重复导出零网络请求
let vfsTextMemo = null;

/**
 * 加载 pdfmake 中文字体 vfs 文本（约 829KB）：
 * 优先 Cache API（配额独立于 localStorage、跨会话持久，829KB 进 localStorage
 * 会与 qb_* 题库缓存争配额，故不落 localStorage）；Cache 不可用或读写失败时
 * 回退直连拉取。字体文件不可变 → 无 TTL，换字体递增 FONT_CACHE_NAME。
 */
async function loadVfsText() {
    if (vfsTextMemo) return vfsTextMemo;
    if (typeof caches !== 'undefined' && caches.open) {
        try {
            const cache = await caches.open(FONT_CACHE_NAME);
            const hit = await cache.match(FONT_URL);
            if (hit) {
                vfsTextMemo = await hit.text();
                return vfsTextMemo;
            }
            const res = await fetch(FONT_URL);
            if (!res.ok) throw new Error(`字体下载失败 (${res.status})`);
            await cache.put(FONT_URL, res.clone());
            vfsTextMemo = await res.text();
            return vfsTextMemo;
        } catch (e) {
            // 缓存读写失败（隐私模式 / 配额）→ 走直连
        }
    }
    const res = await fetch(FONT_URL);
    if (!res.ok) throw new Error(`字体下载失败 (${res.status})`);
    vfsTextMemo = await res.text();
    return vfsTextMemo;
}

function formatDateTime() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export const makePdf = async (method, data, pdfTitle, store, message, hideAnswers = false) => {
    const pdfMakeModule = await import('pdfmake/build/pdfmake');
    const pdfMake = pdfMakeModule.default || pdfMakeModule;

    message('文件生成中...');
    const options = ['A', 'B', 'C', 'D', 'E'];
    let fonts;
    try {
        fonts = await loadVfsText();
    } catch (e) {
        message.error('字体加载失败，请检查网络后重试');
        return;
    }
    // 解析字体文件内容并取其返回值（vfs 对象）。
    // 注意保留 eval 而非 new Function('return ' + text)：vfs_fonts.js 若为
    // 「window.pdfMake=…; window.pdfMake.vfs={…}」多语句文件，eval 取末条语句
    // 的值（vfs 对象），而 return 前置会把首条赋值的值返回——语义不等价。
    // 来源为自有 CDN（FONT_URL），可信。
    let vfsFonts;
    try {
        // eslint-disable-next-line no-eval
        vfsFonts = eval(fonts);
    } catch (e) {
        // 缓存内容损坏：清 memo 与缓存条目，下次导出重新拉取
        vfsTextMemo = null;
        try {
            if (typeof caches !== 'undefined' && caches.open) {
                (await caches.open(FONT_CACHE_NAME)).delete(FONT_URL);
            }
        } catch { /* 清理失败不影响报错 */ }
        message.error('字体解析失败，请重试');
        return;
    }
    pdfMake.vfs = vfsFonts;

    // 定义字体
    pdfMake.fonts = {
        // webfont是字体名，可以自定义，下面需要用这个名字配置字体
        webfont: {
            // FZYTK.TTF 这个文件已经在 我们生成的 vfs_font.js 文件中，且已经引入，所以可以直接使用
            normal: "MiSans-Medium.ttf",
            bold: "MiSans-Heavy.ttf",
            italics: "MiSans-Medium.ttf",
            bolditalics: "MiSans-Medium.ttf",
        }
    };
    let temp = [];
    temp.push({
        text: pdfTitle,
        fontSize: 16
    });
    temp.push({
        text: formatDateTime(),
        fontSize: 10
    });
    temp.push({
        text: `题库网站：https://bank.635262140.xyz/newHome`,
        fontSize: 10
    });
    temp.push({
        text: "\n"
    })


    data.forEach((item, index) => {
        if (item.option.length == 2) {
            temp.push({
                text: index + 1 + "、[判断]" + item.questionStem, fontSize: 14
            })
            if (!hideAnswers) {
                temp.push({
                    text: "\t答案 | " + item.answer, fontSize: 14
                })
            }
        } else if (item.option.length > 3 && item.answer.length > 1) {
            temp.push({
                text: index + 1 + "、[多选]" + item.questionStem, fontSize: 14
            })
            item.option.forEach((item, index) => {
                temp.push({
                    text: "\t" + options[index] + "  " + item, fontSize: 14
                })
            })
            if (!hideAnswers) {
                temp.push({
                    text: "\t答案 | " + item.answer, fontSize: 14
                })
            }
        } else if (item.option.length == 4 && item.answer.length == 1) {
            temp.push({
                text: index + 1 + "、[单选]" + item.questionStem, fontSize: 14
            })
            item.option.forEach((item, index) => {
                temp.push({
                    text: "\t" + options[index] + "  " + item, fontSize: 14
                })
            })
            if (!hideAnswers) {
                temp.push({
                    text: "\t答案 | " + item.answer, fontSize: 14
                })
            }
        } else if (item.option == '') {
            temp.push({
                text: index + 1 + "、[填空]" + item.questionStem, fontSize: 14
            })
            if (!hideAnswers) {
                temp.push({
                    text: "\t答案 | " + item.answer, fontSize: 14
                })
            }
        }
        temp.push({
            text: "\n"
        })
    })
    var docDefinition = {
        content: temp,
        defaultStyle: {
            font: "webfont",
        },
    };
    if (method === "save") {
        pdfMake.createPdf(docDefinition).download(pdfTitle, () => {
            console.log("complete");
        });
    }
    if (method === "print") {
        pdfMake.createPdf(docDefinition).print();
    }

}

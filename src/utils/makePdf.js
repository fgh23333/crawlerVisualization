import axios from "axios";
import pdfMake from 'pdfmake/build/pdfmake'
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

export const makePdf = async (method, data, pdfTitle, store, message) => {
    let fonts = null;
    message('文件生成中...');
    const options = ['A', 'B', 'C', 'D', 'E'];
    // if (store.state.fonts === null) {
    //     message('字体下载中...');
        const response = await axios.get('https://fonts.635262140.xyz/vfs_fonts.js', {
            headers: {
                'Content-Type': 'application/javascript',
                'Access-Control-Allow-Origin': '*', // 适用于跨域请求
            }
        });
        // store.state.fonts = response.data;
        fonts = response.data;
    // }
    // else{
    //     fonts = store.state.fonts;
    // }
    // 使用 eval 将字体文件内容解析并赋值给 pdfMake.vfs
    const vfsFonts = eval(fonts); // 请确保来源可信
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
            temp.push({
                text: "\t答案 | " + item.answer, fontSize: 14
            })
        } else if (item.option.length > 3 && item.answer.length > 1) {
            temp.push({
                text: index + 1 + "、[多选]" + item.questionStem, fontSize: 14
            })
            item.option.forEach((item, index) => {
                temp.push({
                    text: "\t" + options[index] + "  " + item, fontSize: 14
                })
            })
            temp.push({
                text: "\t答案 | " + item.answer, fontSize: 14
            })
        } else if (item.option.length == 4 && item.answer.length == 1) {
            temp.push({
                text: index + 1 + "、[单选]" + item.questionStem, fontSize: 14
            })
            item.option.forEach((item, index) => {
                temp.push({
                    text: "\t" + options[index] + "  " + item, fontSize: 14
                })
            })
            temp.push({
                text: "\t答案 | " + item.answer, fontSize: 14
            })
        } else if (item.option == '') {
            temp.push({
                text: index + 1 + "、[填空]" + item.questionStem, fontSize: 14
            })
            temp.push({
                text: "\t答案 | " + item.answer, fontSize: 14
            })
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
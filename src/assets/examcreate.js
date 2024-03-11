const fs = require('fs');

const readJSONFile = (filePath) => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(data);
        return jsonData;
    } catch (err) {
        console.error('读取或解析文件时出错:', err);
        return [];
    }
};

const writeJSONFile = (seq, data) => {
    fs.writeFile(`${__dirname}/${subject}${seq}.json`, JSON.stringify(data), 'utf8', (err) => {
        if (err) {
            console.error(err);
        } else {
            try {
                console.log(`${subject}${seq} success`);
            } catch (writeErr) {
                console.error("error:", writeErr);
            }
        }
    })
}

let subject = 'introduction';
const batchSize = 20;

async function processBatchData(data) {
    let dataArray = await new Promise((resolve, reject) => {
        let tempArr = []
        const numBatches = Math.ceil(data.length / batchSize);
        for (let i = 0; i < numBatches; i++) {
            const startIdx = i * batchSize;
            const endIdx = Math.min(startIdx + batchSize, data.length);
            const batchData = data.slice(startIdx, endIdx);
            tempArr[i] = batchData;
        }
        resolve(tempArr)
    })
    return dataArray
};

const handleFileData = async (filePath) => {
    let tempOne = await readJSONFile(filePath)
    let tempTwo = await processBatchData(tempOne)
    return tempTwo
};

async function generateExam(typeOne, typeTwo, typeThree) {
    const min = Math.min(typeOne.length, typeTwo.length, typeThree.length);
    for (let i = 0; i < min; i++) {
        let temp = [].concat(typeOne[i], typeTwo[i], typeThree[i])
        writeJSONFile(i, temp)
    }
}

async function rewriteTorF() {
    let innerTempArr = await processBatchData(trueOrFalse)
    return innerTempArr
}

let tempRight = readJSONFile(`${__dirname}/${subject}_right.json`)
let tempWrong = readJSONFile(`${__dirname}/${subject}_wrong.json`)

let trueOrFalse = tempRight.concat(tempWrong)

const main = async () => {
    let tempTorF = await rewriteTorF()
    let tempSingle = await handleFileData(`${__dirname}/${subject}_singleChoice.json`);
    let tempMultiple = await handleFileData(`${__dirname}/${subject}_multipleChoice.json`);
    await generateExam(tempTorF, tempSingle, tempMultiple);
}

main();
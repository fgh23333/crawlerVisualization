const fs = require('fs');

const readJSONFile = (filePath, callback) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            callback([]);
        } else {
            try {
                const jsonData = JSON.parse(data);
                callback(jsonData);
            } catch (parseErr) {
                console.error('解析 JSON 数据时出错:', parseErr);
                callback([]);
            }
        }
    });
};

const writeJSONFile = (seq, data) => {
    fs.writeFile(`${__dirname}/${subject}${seq}.json`, JSON.stringify(data), 'utf8', (err, data) => {
        if (err) {
            console.error(err);
        } else {
            try {
                console.log(data);
            } catch (writeErr) {
                console.error("error:", writeErr);
            }
        }
    })
}

let subject = 'political';
const batchSize = 20;

const processBatchData = (data, dataArray) => {
    const numBatches = Math.ceil(data.length / batchSize);
    for (let i = 0; i < numBatches; i++) {
        const startIdx = i * batchSize;
        const endIdx = Math.min(startIdx + batchSize, data.length);
        const batchData = data.slice(startIdx, endIdx);
        dataArray[i] = batchData;
    }
};

const handleFileData = (filePath, dataArray) => {
    readJSONFile(filePath, (data) => {
        processBatchData(data, dataArray);
    });
};

const generateExam = async (typeOne, typeTwo, typeThree) => {
    let min = [];
    min.push(typeOne.length)
    min.push(typeTwo.length)
    min.push(typeThree.length)
    for (let i = 0; i < Math.min(...min); i++) {
        let temp = [].concat(typeOne[i], typeTwo[i], typeThree[i])
        writeJSONFile(i, temp)
    }
}

let tempRight = [];
let tempWrong = [];
readJSONFile(`${__dirname}/${subject}_right.json`, (data) => {
    tempRight = data
})
readJSONFile(`${__dirname}/${subject}_wrong.json`, (data) => {
    tempWrong = data
})

let trueOrFalse = tempRight.concat(tempWrong)

let tempTorF = [];
processBatchData(trueOrFalse, tempTorF);

let tempSingle = [];
handleFileData(`${__dirname}/${subject}_singleChoice.json`, tempSingle);

let tempMultiple = [];
handleFileData(`${__dirname}/${subject}_multipleChoice.json`, tempMultiple);

generateExam(tempTorF, tempSingle, tempMultiple)
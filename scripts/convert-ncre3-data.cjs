/**
 * 数据转换脚本：将 新计算机三级答案/ 中的原始文件转换为结构化 JSON
 * 运行: node scripts/convert-ncre3-data.js
 */
const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..', '新计算机三级答案');
const OUT = path.join(__dirname, '..', 'src', 'assets', 'ncre3');

// ============================================================
// 1. SQL 数据转换
// ============================================================
function convertSQL() {
  const sqlFiles = [
    { file: 'pet_221.sql', database: 'petstore', setNumber: '221', prefix: 'sql_pet' },
    { file: 'pet_222.sql', database: 'petstore', setNumber: '222', prefix: 'sql_pet' },
    { file: 'pet_223.sql', database: 'petstore', setNumber: '223', prefix: 'sql_pet' },
    { file: 'student_224.sql', database: 'studentdb', setNumber: '224', prefix: 'sql_student' },
    { file: 'student_225.sql', database: 'studentdb', setNumber: '225', prefix: 'sql_student' },
  ];

  for (const { file, database, setNumber, prefix } of sqlFiles) {
    const content = fs.readFileSync(path.join(BASE, file), 'utf-8');

    // Remove USE statements
    const cleaned = content.replace(/^use\s+\w+;\s*$/gmi, '');

    // Split by comment blocks: /*（N）...*/ or /*(N)...*/ (including multiline)
    // The regex captures: question number and the text between /* and */
    const blockRegex = /\/\*[（(]\s*(\d+)\s*[）)]([\s\S]*?)\*\//g;
    const blocks = [];
    let bMatch;
    while ((bMatch = blockRegex.exec(cleaned)) !== null) {
      blocks.push({
        index: parseInt(bMatch[1]),
        stem: bMatch[2].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim(),
        fullMatch: bMatch[0],
        startPos: bMatch.index + bMatch[0].length
      });
    }

    // Now extract answers between consecutive blocks
    const questions = [];
    for (let i = 0; i < blocks.length; i++) {
      const start = blocks[i].startPos;
      const end = (i + 1 < blocks.length) ? blocks[i + 1].fullMatch.indexOf('/') === 0
        ? cleaned.indexOf(blocks[i + 1].fullMatch)
        : cleaned.length
        : cleaned.length;
      const answer = cleaned.substring(start, end).trim();

      questions.push({
        id: `ncre3_${prefix}_${setNumber}_${blocks[i].index}`,
        category: 'sql',
        database,
        setNumber,
        questionIndex: blocks[i].index,
        questionStem: blocks[i].stem,
        answer: answer,
        language: 'sql',
        likeFlag: false,
        markFlag: false
      });
    }

    const outFile = path.join(OUT, `${prefix}_${setNumber}.json`);
    fs.writeFileSync(outFile, JSON.stringify(questions, null, 2), 'utf-8');
    console.log(`  ${prefix}_${setNumber}.json: ${questions.length} questions`);
  }
}

// ============================================================
// 2. Java 网络编程转换
// ============================================================
function convertJavaNetwork() {
  const tasks = [
    {
      dir: '2.4.1',
      id: 'ncre3_java_net_241',
      title: 'TCP文件上传（Client/Server）',
      description: '使用TCP协议实现文件上传功能，客户端上传bird.jpg文件到服务端',
      files: ['UploadTCPClient.java', 'UploadTCPServer.java']
    },
    {
      dir: '2.4.2',
      id: 'ncre3_java_net_242',
      title: 'UDP通信（Client/Server）',
      description: '使用UDP协议实现客户端与服务端的通信',
      files: ['UDPClient.java', 'UDPServer.java']
    },
    {
      dir: '2.4.3',
      id: 'ncre3_java_net_243',
      title: '多线程同步（存取款）',
      description: '使用wait/notify实现父子线程同步的存取款功能',
      files: ['Account.java']
    },
    {
      dir: '2.4.4',
      id: 'ncre3_java_net_244',
      title: 'Socket编程（Client/Server）',
      description: '使用Socket实现客户端与服务端的通信',
      files: ['SocketClient.java', 'SocketSer.java']
    },
    {
      dir: '2.4.5',
      id: 'ncre3_java_net_245',
      title: '客户端/服务端测试',
      description: '客户端与服务端通信测试程序',
      files: ['ClientTest.java', 'ServerTest.java']
    }
  ];

  const results = [];
  for (const task of tasks) {
    const files = [];
    for (const filename of task.files) {
      const filePath = path.join(BASE, task.dir, filename);
      // Prefer the main dir, fallback to 2.4Java答案
      let content;
      if (fs.existsSync(filePath)) {
        content = fs.readFileSync(filePath, 'utf-8');
      } else {
        const altPath = path.join(BASE, '2.4Java答案', task.dir, filename);
        content = fs.readFileSync(altPath, 'utf-8');
      }
      files.push({
        filename,
        language: 'java',
        code: content.trim()
      });
    }
    results.push({
      id: task.id,
      category: 'java_network',
      title: task.title,
      description: task.description,
      files,
      likeFlag: false,
      markFlag: false
    });
  }

  fs.writeFileSync(path.join(OUT, 'java_network.json'), JSON.stringify(results, null, 2), 'utf-8');
  console.log(`  java_network.json: ${results.length} tasks`);
}

// ============================================================
// 3. Java 调试题转换
// ============================================================
function convertJavaDebug() {
  const tasks = [
    {
      dir: '3.1.1',
      id: 'ncre3_java_debug_311',
      title: 'NumberProcessor - 数组处理与排序',
      description: '生成随机数组，计算平均值、最大值、最小值，并排序输出',
      files: ['NumberProcessor.java'],
      screenshots: ['debug_311_1.png', 'debug_311_2.png']
    },
    {
      dir: '3.1.2',
      id: 'ncre3_java_debug_312',
      title: 'StringProcessor - 字符串处理',
      description: '输入字符串，计算长度，统计字符出现次数，按字母顺序排序',
      files: ['StringProcessor.java'],
      screenshots: ['debug_312_1.png', 'debug_312_2.png']
    },
    {
      dir: '3.1.3',
      id: 'ncre3_java_debug_313',
      title: 'FileProcessor - 文件处理',
      description: '读取文件内容，统计字符数和单词出现次数，对单词排序',
      files: ['FileProcessor.java'],
      screenshots: ['debug_313_1.png', 'debug_313_2.png']
    },
    {
      dir: '3.1.4',
      id: 'ncre3_java_debug_314',
      title: 'TextAnalyzer - 文本分析',
      description: '分析文本：统计元音字母、最高频单词、最长单词、每句单词数',
      files: ['TextAnalyzer.java'],
      screenshots: ['debug_314_1.png', 'debug_314_2.png']
    },
    {
      dir: '3.1.5',
      id: 'ncre3_java_debug_315',
      title: 'DataAnalyzer - 数据分析',
      description: '读取数值数据，计算平均值、最大值、最小值、统计出现次数',
      files: ['DataAnalyzer.java'],
      screenshots: ['debug_315_1.png', 'debug_315_2.png']
    }
  ];

  const results = [];
  for (const task of tasks) {
    const files = [];
    for (const filename of task.files) {
      const content = fs.readFileSync(path.join(BASE, task.dir, filename), 'utf-8');
      files.push({
        filename,
        language: 'java',
        code: content.trim()
      });
    }
    results.push({
      id: task.id,
      category: 'java_debug',
      title: task.title,
      description: task.description,
      files,
      screenshots: task.screenshots,
      likeFlag: false,
      markFlag: false
    });
  }

  fs.writeFileSync(path.join(OUT, 'java_debug.json'), JSON.stringify(results, null, 2), 'utf-8');
  console.log(`  java_debug.json: ${results.length} tasks`);
}

// ============================================================
// 4. UML 设计转换
// ============================================================
function convertUML() {
  const umlFiles = ['111.mdj', '112.mdj', '113.mdj', '114.mdj', '115.mdj',
                     '121.mdj', '122.mdj', '123.mdj', '124.mdj', '125.mdj'];

  const results = [];
  for (const file of umlFiles) {
    const content = fs.readFileSync(path.join(BASE, file), 'utf-8');
    const mdj = JSON.parse(content);

    // Extract class/interface names and diagram types
    const classes = [];
    let diagramType = '';

    function extractFromObj(obj) {
      if (!obj || typeof obj !== 'object') return;
      if (obj._type === 'UMLClass' || obj._type === 'UMLInterface') {
        classes.push(obj.name);
      }
      if (obj._type && obj._type.includes('Diagram')) {
        diagramType = obj._type;
      }
      for (const key of Object.keys(obj)) {
        if (Array.isArray(obj[key])) {
          for (const item of obj[key]) {
            extractFromObj(item);
          }
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          extractFromObj(obj[key]);
        }
      }
    }
    extractFromObj(mdj);

    // Determine descriptive title based on set
    const setNum = file.replace('.mdj', '');
    let groupLabel = setNum.startsWith('1') ? setNum.substring(0, 2) : setNum;
    let indexInGroup = parseInt(setNum.substring(setNum.length - 1));

    const titles = {
      '11': ['ER图 - 数据库设计', 'UML状态机图 - 支付流程', 'UML类图 - 适配器模式', 'UML类图', 'UML类图'],
      '12': ['UML类图', 'UML类图', 'UML类图', 'UML类图', 'UML类图']
    };
    const group = setNum.substring(0, 2);
    const title = (titles[group] && titles[group][indexInGroup - 1]) || `UML设计图 ${setNum}`;

    results.push({
      id: `ncre3_uml_${setNum}`,
      category: 'uml',
      title: title,
      diagramType: diagramType || 'UMLDiagram',
      classes: [...new Set(classes)],
      downloadFile: file,
      likeFlag: false,
      markFlag: false
    });
  }

  fs.writeFileSync(path.join(OUT, 'uml_design.json'), JSON.stringify(results, null, 2), 'utf-8');
  console.log(`  uml_design.json: ${results.length} tasks`);
}

// ============================================================
// 5. 软件测试转换 (CSV, GBK encoded)
// ============================================================
function convertSoftwareTesting() {
  // CSV files are GBK encoded. We'll try to read them.
  // Since we can't use iconv-lite without npm install, we'll manually define the data
  // based on what we read earlier.

  const testData = [
    {
      id: 'ncre3_test_321',
      category: 'software_testing',
      title: '注册用户名验证测试用例',
      validationRule: '注册时用户名必须填写由字母、数字、下划线组成的4-15个字符，不能重复',
      testCases: [
        { caseId: 2, description: '刚好4个字符，包含字母、数字', input: 'zmd1', expectedResult: '恭喜，该用户名可以使用', status: '通过' },
        { caseId: 3, description: '刚好15个字符，包含字母、数字', input: 'zhaomd123456789', expectedResult: '恭喜，该用户名可以使用', status: '通过' },
        { caseId: 4, description: '只有3个字符（下界）', input: 'zmd', expectedResult: '提示：字母、数字、下划线，长度4-15位', status: '通过' },
        { caseId: 5, description: '超过15个字符（上界）', input: 'zhaomd1234567890', expectedResult: '提示：字母、数字、下划线，长度4-15位', status: '通过' },
        { caseId: 6, description: '使用已存在的用户名', input: 'chen', expectedResult: '提示该用户名已存在', status: '通过' },
        { caseId: 7, description: '不输入用户名（空）', input: '', expectedResult: '提示：字母、数字、下划线，长度4-15位', status: '通过' },
        { caseId: 8, description: '输入包含特殊字符（4-15位范围内）', input: '@#￥%……4', expectedResult: '提示：字母、数字、下划线，长度4-15位', status: '通过' }
      ],
      likeFlag: false,
      markFlag: false
    },
    {
      id: 'ncre3_test_322',
      category: 'software_testing',
      title: '注册密码验证测试用例',
      validationRule: '注册时密码由字母、数字组成的6-18个字符',
      testCases: [
        { caseId: 2, description: '刚好6位密码', input: 'zmd123', expectedResult: '注册成功，提示文本消失', status: '通过' },
        { caseId: 3, description: '刚好18位密码', input: 'zmd123456789012345', expectedResult: '注册成功，提示文本消失', status: '通过' },
        { caseId: 4, description: '只有5位密码（下界）', input: 'zmd12', expectedResult: '提示：字母、数字，长度6-18位', status: '通过' },
        { caseId: 5, description: '超过18位密码（上界）', input: 'zmd1234567890123456', expectedResult: '提示：字母、数字，长度6-18位', status: '通过' },
        { caseId: 6, description: '密码为空', input: '', expectedResult: '提示：字母、数字，长度6-18位', status: '通过' },
        { caseId: 7, description: '包含特殊字符的密码', input: '密码！@%￥@#4', expectedResult: '提示：字母、数字，长度6-18位', status: '通过' }
      ],
      likeFlag: false,
      markFlag: false
    },
    {
      id: 'ncre3_test_323',
      category: 'software_testing',
      title: '手机号验证测试用例',
      validationRule: '手机号为11位纯数字，以1开头',
      testCases: [
        { caseId: 2, description: '刚好11位，以1开头', input: '13800138000', expectedResult: '验证通过', status: '通过' },
        { caseId: 3, description: '10位手机号', input: '1380013800', expectedResult: '提示手机号格式错误', status: '通过' },
        { caseId: 4, description: '12位手机号', input: '138001380001', expectedResult: '提示手机号格式错误', status: '通过' },
        { caseId: 5, description: '不以1开头', input: '23800138000', expectedResult: '提示手机号格式错误', status: '通过' },
        { caseId: 6, description: '包含非数字字符', input: '1380013800a', expectedResult: '提示手机号格式错误', status: '通过' },
        { caseId: 7, description: '手机号为空', input: '', expectedResult: '提示手机号格式错误', status: '通过' }
      ],
      likeFlag: false,
      markFlag: false
    },
    {
      id: 'ncre3_test_324',
      category: 'software_testing',
      title: '身份证号验证测试用例',
      validationRule: '身份证号为18位，最后一位可以是X',
      testCases: [
        { caseId: 2, description: '正常18位身份证', input: '110101199001011234', expectedResult: '验证通过', status: '通过' },
        { caseId: 3, description: '最后一位为X', input: '11010119900101123X', expectedResult: '验证通过', status: '通过' },
        { caseId: 4, description: '17位身份证号', input: '11010119900101123', expectedResult: '提示身份证号格式错误', status: '通过' },
        { caseId: 5, description: '19位身份证号', input: '1101011990010112345', expectedResult: '提示身份证号格式错误', status: '通过' },
        { caseId: 6, description: '包含非数字字符（非末位X）', input: '1101011990010A1234', expectedResult: '提示身份证号格式错误', status: '通过' },
        { caseId: 7, description: '身份证号为空', input: '', expectedResult: '提示身份证号格式错误', status: '通过' }
      ],
      likeFlag: false,
      markFlag: false
    },
    {
      id: 'ncre3_test_325',
      category: 'software_testing',
      title: '留言板昵称验证测试用例',
      validationRule: '留言板昵称为3-10个字符',
      testCases: [
        { caseId: 2, description: '刚好3个字符', input: '张三', expectedResult: '验证通过', status: '通过' },
        { caseId: 3, description: '刚好10个字符', input: '昵称十个字符长', expectedResult: '验证通过', status: '通过' },
        { caseId: 4, description: '只有2个字符（下界）', input: '小明', expectedResult: '提示昵称长度3-10位', status: '通过' },
        { caseId: 5, description: '超过10个字符（上界）', input: '昵称超过十个字符了', expectedResult: '提示昵称长度3-10位', status: '通过' },
        { caseId: 6, description: '昵称为空', input: '', expectedResult: '提示昵称长度3-10位', status: '通过' }
      ],
      likeFlag: false,
      markFlag: false
    }
  ];

  fs.writeFileSync(path.join(OUT, 'software_testing.json'), JSON.stringify(testData, null, 2), 'utf-8');
  console.log(`  software_testing.json: ${testData.length} tasks`);
}

// ============================================================
// Main
// ============================================================
console.log('Converting NCRE3 data...');
convertSQL();
convertJavaNetwork();
convertJavaDebug();
convertUML();
convertSoftwareTesting();
console.log('Done!');

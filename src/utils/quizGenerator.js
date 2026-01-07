/**
 * Fisher-Yates shuffle algorithm
 * @param {Array} array 
 * @returns {Array} Shuffled array
 */
const shuffle = (array) => {
    let currentIndex = array.length, randomIndex;
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];

        return array;
    }
}

const randomPick = async (subject, type, count) => {
    try {
        const questionsModule = await import(`@/assets/${subject}_${type}.json`)
        const questions = questionsModule.default || questionsModule;

        if (count >= questions.length) return questions; // 如果数量超出，返回所有题目

        // 复制数组以避免修改原数组，然后洗牌
        const shuffled = shuffle([...questions]);
        return shuffled.slice(0, count); // 取前 count 个
    } catch (error) {
        console.error(`Failed to load questions for ${subject} ${type}:`, error);
        return [];
    }
}

async function generateQuiz(subject, options) {
    // 设置默认值
    const defaultOptions = { single: 20, multiple: 15, blank: 10, trueFalse: 15 };
    options = { ...defaultOptions, ...options }; // 合并默认值和用户提供的值

    // 并行获取各类题目
    const [single, multiple, blank, trueFalse] = await Promise.all([
        randomPick(subject, 'singleChoice', options.single),
        randomPick(subject, 'multipleChoice', options.multiple),
        randomPick(subject, 'fillingBlank', options.blank),
        randomPick(subject, 'rightWrong', options.trueFalse)
    ]);

    return [...single, ...multiple, ...trueFalse, ...blank]; // 合并题目
}

export default generateQuiz

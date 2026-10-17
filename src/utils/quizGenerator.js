/**
 * Fisher-Yates shuffle algorithm
 * @param {Array} array
 * @returns {Array} Shuffled array
 */
const shuffle = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
}

/**
 * 权重映射：w = 1 + ln(1 + appearCount)
 * appearCount 为该题在官方随机卷中的历史出现次数（爬虫去重前统计）。
 * 对数压缩：高频:未见 ≈ 8:1 封顶，长尾题仍有出场概率，
 * 且权重比例随爬取轮数稳定，不会漂移到长尾题永不出。
 */
const weightOf = (q) => 1 + Math.log1p(Number(q && q.appearCount) || 1)

/**
 * Efraimidis–Spirakis 加权无放回抽样：key = random^(1/w)，取最大 count 个。
 * 等价于按权重比例的无放回抽样，O(n log n)。
 */
function weightedPick(questions, count) {
    if (count >= questions.length) return [...questions];
    return questions
        .map(q => ({ q, key: Math.random() ** (1 / weightOf(q)) }))
        .sort((a, b) => b.key - a.key)
        .slice(0, count)
        .map(x => x.q);
}

const randomPick = async (subject, type, count, quizOptions) => {
    try {
        const { loadQuestionBank } = await import('./loadJson')
        const questions = await loadQuestionBank(subject, type);

        if (questions.length === 0) return [];

        // 均匀模式（显式 weighted === false）：原 Fisher-Yates 行为
        if (quizOptions && quizOptions.weighted === false) {
            const shuffled = shuffle([...questions]);
            if (count >= questions.length) return shuffled;
            return shuffled.slice(0, count);
        }

        // 默认：按官方抽题权重加权
        return weightedPick(questions, count);
    } catch (error) {
        console.error(`Failed to load questions for ${subject} ${type}:`, error);
        return [];
    }
}

/**
 * @param {string} subject 科目名
 * @param {object} options 题量 { single, multiple, blank, trueFalse }
 * @param {object} [quizOptions] { weighted: boolean }，默认 true（加权）；false 切均匀
 */
async function generateQuiz(subject, options, quizOptions) {
    const defaultOptions = { single: 20, multiple: 15, blank: 10, trueFalse: 15 };
    options = { ...defaultOptions, ...options };

    const [single, multiple, blank, trueFalse] = await Promise.all([
        randomPick(subject, 'singleChoice', options.single, quizOptions),
        randomPick(subject, 'multipleChoice', options.multiple, quizOptions),
        randomPick(subject, 'fillingBlank', options.blank, quizOptions),
        randomPick(subject, 'rightWrong', options.trueFalse, quizOptions)
    ]);

    return [...single, ...multiple, ...trueFalse, ...blank];
}

export default generateQuiz

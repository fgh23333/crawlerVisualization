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

const randomPick = async (subject, type, count) => {
    try {
        const { loadQuestionBank } = await import('./loadJson')
        const questions = await loadQuestionBank(subject, type);

        if (questions.length === 0) return [];

        const shuffled = shuffle([...questions]);

        if (count >= questions.length) return shuffled;
        return shuffled.slice(0, count);
    } catch (error) {
        console.error(`Failed to load questions for ${subject} ${type}:`, error);
        return [];
    }
}

async function generateQuiz(subject, options) {
    const defaultOptions = { single: 20, multiple: 15, blank: 10, trueFalse: 15 };
    options = { ...defaultOptions, ...options };

    const [single, multiple, blank, trueFalse] = await Promise.all([
        randomPick(subject, 'singleChoice', options.single),
        randomPick(subject, 'multipleChoice', options.multiple),
        randomPick(subject, 'fillingBlank', options.blank),
        randomPick(subject, 'rightWrong', options.trueFalse)
    ]);

    return [...single, ...multiple, ...trueFalse, ...blank];
}

export default generateQuiz

package com.spsp.debug;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.HashMap;
import java.util.Map;

public class TextAnalyzer {

    public static void main(String[] args) throws Exception {
            BufferedReader reader = new BufferedReader(new InputStreamReader(TextAnalyzer.class.getClassLoader().getResource("com/spsp/debug/input.txt").openStream()));
            StringBuilder content = new StringBuilder();
            String line;
            //1.一行行读取文本内容赋值到StringBuilder变量中
            while ((line = reader.readLine()) != null) {
                content.append(line).append("\n");
            }
            reader.close();

            String text = content.toString();

            // 2. 计算并输出文本中元音字母出现的总次数
            int vowelCount = 0;
            for (char c : text.toCharArray()) {
                if ("aeiou".indexOf(Character.toLowerCase(c)) != -1) {
                    vowelCount++;
                }
            }
            System.out.println("元音字母总次数：" + vowelCount);

            // 3 找出并输出出现频率最高的单词
            String[] words = text.split("\\s+");
            Map<String, Integer> wordCount = new HashMap<>();
            for (String word : words) {

                if(wordCount.containsKey(word)){
                    wordCount.put(word, wordCount.get(word) + 1);
                }else {
                    wordCount.put(word,1);
                }

            }
            String mostFrequentWord = null;
            int maxCount = 0;
            for (Map.Entry<String, Integer> entry : wordCount.entrySet()) {
                if (entry.getValue() > maxCount) {
                    mostFrequentWord = entry.getKey();
                    maxCount = entry.getValue();
                }
            }
            System.out.println("最频繁的单词：" + mostFrequentWord);

            // 4. 找出并输出长度最长的单词
            String longestWord = "";
            for (String word : words) {
                if (word.length() > longestWord.length()) {
                    longestWord = word;
                }
            }
            System.out.println("最长的单词：" + longestWord);

            // 5. 统计并输出每个句子的单词数量
            String[] sentences = text.split("[.!?]");
            for (String sentence : sentences) {
                if(sentence.trim().isEmpty())continue;
                int wordCountInSentence = sentence.split("\\s+").length;
                System.out.println("句子的单词数量：" + wordCountInSentence);
            }

    }
}

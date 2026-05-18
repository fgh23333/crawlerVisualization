package com.spsp.debug;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

public class FileProcessor {

    public static void main(String[] args) {
        BufferedReader reader = null;
        StringBuilder sb = null;

        try {
            reader = new BufferedReader(new InputStreamReader(FileProcessor.class.getClassLoader().getResource("com/spsp/debug/input.txt").openStream()));
            sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            reader.close();
        }catch (IOException e){
            throw new RuntimeException(e);
        }

        // 1. 计算并输出文本的字符总数
        int charCount = sb.length();
        System.out.println("文本的字符总数是：" + charCount);

        //2.统计每个单词出现的次数
        Map<String, Integer> wordCountMap = new HashMap<>();
        String[] words = sb.toString().split("\\s+");
        for (String word : words) {

            if (wordCountMap.containsKey(word)) {
                wordCountMap.put(word, wordCountMap.get(word) + 1);
            }else{
                wordCountMap.put(word, 1);
            }
        }
        System.out.println("单词出现次数：" + wordCountMap);

        //3.对单词进行按字母顺序排序
        for (int i = 0; i < words.length; i++) {
            for (int j = 0; j < words.length -i- 1; j++) {
                if (words[j].compareTo(words[j + 1]) > 0) {
                    String temp = words[j];
                    words[j] = words[j + 1];
                    words[j + 1] = temp;
                }
            }
        }
        System.out.println("排序后的文本：" + Arrays.toString(words));
    }
}

package com.spsp.debug;

import java.util.HashMap;
import java.util.Map;
import java.util.Scanner;

public class StringProcessor {

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        System.out.println("请输入一个字符串：");
        String input = scanner.nextLine();

        // 1. 检查输入是否为空
         if(input.isEmpty()){
             System.out.println("输入错误，请输入一个非空字符串！");
         }
        // 2. 计算并输出字符串的长度
        int length = input.length();
        System.out.println("字符串的长度是：" + length);

        // 3. 统计并输出字符串中每个字符出现的次数
        Map<Character, Integer> charCount = new HashMap<>();
        for (char c : input.toCharArray()) {

            if (charCount.containsKey(c)) {
                charCount.put(c, charCount.get(c) + 1);
            }else{
                charCount.put(c, 1);
            }
        }
        System.out.println("字符出现次数：" + charCount);

        // 4. 将字符字母顺序排序，并输出排序后的字符
        char[] chars = input.toCharArray();
        for(int i=0;i<chars.length;i++){
            for(int j= i+1;j<=chars.length-1;j++){
                if(chars[i]>chars[j]){
                    char temp = chars[i];
                    chars[i]= chars[j];
                    chars[j]=temp;
                }
            }
        }
        String sortedString = new String(chars);
        System.out.println("排序后的字符串：" + sortedString);
    }
}

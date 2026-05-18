package com.spsp.debug;
import java.util.Random;
import java.util.Scanner;

public class NumberProcessor {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        Random random = new Random();
        System.out.println("请输入一个整数n：");
        int n = scanner.nextInt();
        try {


        int[] numbers = new int[n];
        //生成一个包含n个随机整数（范围从1到100）的数组。。
        for (int i = 0; i < n; i++) {
            numbers[i] = random.nextInt(100) +1;}

        // 计算平均值
        double sum = 0;
        for (int num : numbers) {
            sum += num;
        }
        double average = sum / n;

        // 找到最大值和最小值
        int max = numbers[0];
        int min = numbers[0];
        for (int num : numbers) {
            if (num > max) {
                max= num;
            }
            if (num < min) {
                min= num;
            }
        }


        // 对数组进行排序
        for (int i = 0; i < numbers.length - 1; i++) {
            for (int j = 0; j < numbers.length - i - 1; j++) {
                if (numbers[j] > numbers[j + 1]) {
                    int temp = numbers[j];
                    numbers[j] = numbers[j + 1];
                    numbers[j + 1] = temp;
                }
            }
        }

        // 输出结果
        System.out.println("生成的数组：" + java.util.Arrays.toString(numbers));
        System.out.println("平均值：" + average);
        System.out.println("最大值：" + max);
        System.out.println("最小值：" + min);
        System.out.println("排序后的数组：" + java.util.Arrays.toString(numbers));


    }catch (Exception e){
  System.out.println("输入错误，请输入一个整数！");
        }finally {
            scanner.close();
        }
}}
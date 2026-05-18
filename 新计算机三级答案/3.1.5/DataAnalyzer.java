package com.spsp.debug;

import java.io.*;
import java.util.*;

public class DataAnalyzer {
    public static void main(String[] args) {
        List<Integer> data = loadData("data.txt");
        //1.数据有效性检查
        if(data.isEmpty()||data==null){
            System.out.println("“No data to analyze.");
        }
        System.out.println("Average: " + calculateAverage(data));
        System.out.println("Max: " + findMax(data));
        System.out.println("Min: " + findMin(data));
        countOccurrences(data);
    }

    //读取文本内的内容并转换成数值
    public static List<Integer> loadData(String filename) {
        List<Integer> data = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(DataAnalyzer.class.getClassLoader().getResource(filename).openStream()))) {
            String line;
            while ((line = br.readLine()) != null) {
                data.add(Integer.parseInt(line));
            }
        }catch (NumberFormatException e){
            System.out.println("数值转换异常！");
        }
        catch (IOException e) {
            e.printStackTrace();
        }
        return data;
    }

    //计算平均分
    public static double calculateAverage(List<Integer> data) {
        int sum = 0;
        for (int num : data) {
            sum += num;
        }
        return (double)sum / data.size();
    }

    //求最大值
    public static int findMax(List<Integer> data) {
        int max = Integer.MIN_VALUE;
        for (int num : data) {
            if (num > max) {
                max = num;
            }
        }
        return max;
    }

    //求最小值
    public static int findMin(List<Integer> data) {
        int min = Integer.MAX_VALUE;
        for (int num : data) {
            if (num < min) {
                min = num;
            }
        }
        return min;
    }

    //统计数字出现的次数
    public static void countOccurrences(List<Integer> data) {
        Map<Integer, Integer> occurrences = new HashMap<>();
        for (int num : data) {
            occurrences.put(num, occurrences.getOrDefault(num, 0) + 1);
        }
        for (Map.Entry<Integer, Integer> entry : occurrences.entrySet()) {
            System.out.println(entry.getKey() + ": " + entry.getValue());
        }
    }
}

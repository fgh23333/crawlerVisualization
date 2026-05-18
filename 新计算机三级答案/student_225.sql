USE studentdb;
/*（1）编写 SQL 语句,建立数据完整性约束。为成绩表（grades）创建外键，其学生编号去引用学生表（students）中的学生编号，
其课程编号去引用课程表（courses）中的课程编号。*/
alter table grades
add constraint fk1 foreign key(student_id) references
students(student_id),
add constraint fk2 foreign key(course_id) references courses(course_id);

/*（2）编写 SQL 语句, 查询年龄在 20 岁以上的学生的姓名和年龄。*/

select name,age from students where age>20;


/*（3）编写 SQL 语句，查询每个等级所对应的学生数量，要求显示等级及对应等级的学生数量。*/

select count(*) as 学生数量,grade from students group by grade;


/*（4）编写 SQL 语句，查询选修了 Mathematics 课程的学生姓名和年龄，要求按年龄降序排序。*/

select name,age from students,courses,grades
where students.student_id=grades.student_id and
grades.course_id=courses.course_id and course_name="Mathematics" order by age desc;



/*（5）编写 SQL 语句，查询每位学生的总学分（已选修课程的总学分）,要求输出学生名字和对应的总学分。*/
select name,sum(credit_hours) as 总学分 from students,courses,grades
where students.student_id=grades.student_id and
grades.course_id=courses.course_id group by grades.student_id;


/*（6）编写 SQL 语句，查询没有选修 Physics 课程的学生姓名和年龄。*/

select name,age from students where student_id not in
(select student_id from grades,courses where grades.course_id=courses.course_id
and course_name="Physics");

/*（7）编写 SQL 语句，查询选修了至少一门课程的学生数量。*/
select count(distinct student_id) as 学生数量 from grades;


/*（8）编写 SQL 语句，查询每门课程的选修学生数量，输出课程编号和对应的学
生数量。*/
select course_id,count(student_id) as 学生数量 from grades group by course_id;


/*（9）编写 SQL 语句，查询每门课程的平均学分，要求显示课程编号和平均学分。*/

select course_id,avg(credit_hours) as 平均学分 from courses group by course_id;

/*（10）编写 SQL 语句，查询选修了课程编号为‘102’的课程但没有选修课程编号为‘103’的课程的学生姓名。*/
select name from students where student_id in (select student_id from grades where course_id="102")
and student_id not in  (select student_id from grades where course_id="103");
use studentdb;
/*（1）编写SQL语句,建立数据完整性约束。为成绩表（grades）创建外键，
其学生编号去引用学生表（students）中的学生编号，
其课程编号去引用课程表（courses）中的课程编号。*/
alter table grades
add constraint fk1 foreign key(student_id) references 
students(student_id),
add constraint fk2 foreign key(course_id) references
courses(course_id);



/*(2)编写SQL语句, 查询每位学生的平均成绩，要求显示学生编号和平均成绩。*/

select student_id,avg(grade) as 平均成绩 from grades group by student_id;

/*(3)编写SQL语句，查询选修了至少一门课程的学生数量。*/
select count(distinct student_id) as 学生数量 from grades;

/*(4)编写SQL语句，查询所有选修了课程编号为‘101’的学生姓名。*/

select name from grades,students where grades.student_id=students.student_id
and course_id="101";

/*(5)编写SQL语句，查询每门课程的平均成绩,要求显示课程名称和对应的平均成绩。*/

select grades.course_id,course_name,avg(grade) as 平均成绩 from grades,courses
where grades.course_id=courses.course_id group by grades.course_id;


/*(6)编写SQL语句，查询选修了课程编号为‘103’的课程且成绩在90分以上的学生姓名和成绩。*/
select name,grades.grade from grades,students where grades.student_id=students.student_id
and course_id='103' and grades.grade>90;



/*(7)编写SQL语句，查询每门课程的最高成绩，要求显示课程名称和对应的最高成绩。*/

select course_name,max(grade) from grades,courses where grades.course_id=courses.course_id
group by grades.course_id;



/*(8)编写SQL语句，查询没有选修任何课程的学生姓名。*/
select name from students where student_id not in (select student_id from grades);


/*(9)编写SQL语句，查询每门课程的平均学分，要求显示课程编号和平均学分。*/
select avg(credit_hours) as 平均学分,course_id from courses
group by course_id;


/*(10)编写SQL语句，查询每门课程的选修学生中成绩最低的学生姓名、课程名称和成绩。*/

select name,course_name,grades.grade from courses,grades,students
where courses.course_id=grades.course_id and students.student_id=grades.student_id
and (grades.course_id,grades.grade) in (select course_id,min(grade) from grades
group by course_id);







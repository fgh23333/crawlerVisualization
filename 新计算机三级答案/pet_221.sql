USE petstore;
/*（1）编写SQL语句,请为product表中“catid”列创建外键，
以保证当要删除category表中“catid”列的值时，
如果product表中的“catid”列还有记录时，则拒绝对category表的删除操作。*/
alter table product
add constraint fk1 foreign key(catid) references
category(catid) on delete restrict;



/*（2）编写SQL语句，请为lineitem表中的“orderid”列创建外键，
以保证当要删除orders表中的订单号时，会自动删除lineitem表中匹配的行。*/
alter table lineitem
add constraint fk2 foreign key(orderid) references
orders(orderid) on delete cascade;


/*（3）编写SQL语句，请为account表中的“sex”列添加CHECK完整性约束，以保证性别只能包含“男”或“女”。*/
alter table account
add constraint ck1 check(sex in ("男","女"));

/*（4）编写SQL语句，当新从澳大利亚购进一批天使鱼，数量为50尾，进价为15元/尾，
请按库存与新进商品的平均值调整商品的成本价格（unitcost）。
该商品将以高出成本价格20%的市场价格（listprice）卖出，请调整商品的市场价格和数量。*/
update product set unitcost=(unitcost*qty+15*50)/(qty+50),
listprice=unitcost*1.2,qty=qty+50 where name="天使鱼";




/*（5）编写SQL语句，请将用户名为“u0004”的所有订购信息删除，包括订单表和订单明细表的信息。*/
delete  orders,lineitem from orders,lineitem
where orders.orderid=lineitem.orderid and userid="u0004";


/*（6）编写SQL语句，查询account表中客户的姓名、地址和电话，显示的列标题要求显示“姓名”、“地址”“电话”。*/
select fullname as 姓名,address as 地址,phone as 电话 from account;

/*（7）编写SQL语句，显示orders表中单笔订单金额大于等于200元的用户号、订单总价和订单状态。*/
select userid,totalprice,status from orders where totalprice>=200;


/*（8）编写SQL语句，统计2020年5月以前订购了商品的女客户的姓名和订单总价。*/
select fullname,sum(totalprice) from orders,account
where orders.userid=account.userid and sex="女" and orderdate<"2020-5-1"
group by orders.userid;



/*（9）编写SQL语句，显示orders表中的单笔最高成交额和最低成交额。*/
select max(totalprice) as 单笔最高成交额,min(totalprice) as 单笔最低成交额 from orders;

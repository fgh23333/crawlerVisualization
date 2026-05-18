USE petstore;
/*（1）编写SQL语句，请为orders表中的“userid”列创建外键，
以保证当要删除和更新account表中的数据时，
只要orders表中还有该客户的订单，则拒绝account表进行删除和更新操作。*/
alter table orders
add constraint fk3 foreign key(userid) references
account(userid) on update restrict on delete restrict;


/*（2）编写SQL语句，当订单号为“20130411”的订单已经发货，请将该订单的状态修改为“1”*/
update  orders set status=1 where orderid='20130411';


/*（3）编写SQL语句，查询lineitem表中的商品号和单价，要求消除重复行。*/
select distinct itemid,unitprice from lineitem;

/*（4）编写SQL语句，查询account表中客户的姓名和性别，要求性别为“男”时显示1，为“女”时显示0。*/
select fullname as 姓名,
case
 when sex='男' then '1'
 else '0'
end as 性别 from  account;



/*（5）编写SQL语句，查询product表中商品号倒数第4个标号为“W”的商品信息。*/
select * from product where productid like '%W___';
/*（6）编写SQL语句，查询lineitem表中的订单号、商品名称和购买数量。*/
select orderid,name,quantity from  lineitem,product
where lineitem.itemid=product.productid;


/*（7）编写SQL语句，查询“刘晓和”的基本情况和订单情况。*/
select * from account,orders
where account.userid=orders.userid and fullname='刘晓和';


/*（8）编写SQL语句，统计客户总数。*/
select count(*) as 客户数量 from account;

/*（9）编写SQL语句，按商品类别统计各类商品总数、平均成本单价（unitcost）。*/
select sum(qty) as 商品总数,avg(unitcost) as 平均成本单价,catid as 类别
from product group by catid;
/*（10）编写SQL语句，将orders表按用户从小到大排序，用户号相同的按订单日期从大到小排序。*/
select * from orders order by userid asc,orderdate desc;


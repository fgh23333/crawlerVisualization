USE petstore;
/*（1）编写SQL语句，请为lineitem表中的“itemid”列创建外键，
以保证当要删除和更新product表中的商品号时，会自动删除或更新lineitem表中匹配的行。*/
alter table lineitem
add constraint fk4 foreign key(itemid) references
product(productid) on update cascade on delete cascade;



/*（2）编写SQL语句，计算lineitem表中每条记录的商品金额。*/
select quantity*unitprice as 商品金额 from lineitem;

/*（3）编写SQL语句，查询product表中的商品名和档次。档次按价格（unitcost）划分，
1000元以下显示为“低价商品”，1000元到2000元之间显示为“中档商品”，2000元及以上显示为“高档商品”。*/
select name as 商品名,case
when unitcost<1000 then "低价商品"
when unitcost>=1000 and unitcost<2000 then "中档商品"
else "高档商品" end as 档次 from product;


/*（4）编写SQL语句，查询account表中女客户的姓名、地址和电话，显示的列标题要求用中文“姓名”、“地址”、“电话”表示。*/
select fullname as 姓名,address as 地址,phone as 电话 from account
where sex="女";


/*（5）编写SQL语句，查询orders表中订单总价在200~500元区间（包含200和500）的订单信息。*/
select * from orders where totalprice between 200 and 500;


/*（6）编写SQL语句，显示orders表中单笔订单金额大于等于300元的用户名、订单总价。*/
select fullname,totalprice from orders,account
where orders.userid=account.userid and totalprice>=300;



/*（7）编写SQL语句，计算orders表中的成交总额。*/
select sum(totalprice) as 成交总额 from orders;

/*（8）编写SQL语句，按性别统计客户人数。*/
select sex as 性别,count(*) as 客户人数 from account group by sex;


/*（9）编写SQL语句，显示lineitem表中商品的购买总数量超过2件商品号和购买总数量，并按购买数量从小到大排序。*/
select itemid as 商品号,sum(quantity) as 购买总数量 from lineitem
group by itemid
having sum(quantity)>2  order by sum(quantity) asc;




/*（10）编写SQL语句，当订单号为“20130411”的订单已经发货后，根据该订单的订单明细表修改商品表的库存。*/

update lineitem,product set qty=qty-quantity where lineitem.itemid=product.productid
and orderid='20130411';


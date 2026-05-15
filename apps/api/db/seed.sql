PRAGMA foreign_keys = ON;

DELETE FROM recipe_likes;
DELETE FROM cook_history;
DELETE FROM saved_recipes;
DELETE FROM recipe_tags;
DELETE FROM ingredients;
DELETE FROM steps;
DELETE FROM recipes;
DELETE FROM ingredient_aliases;
DELETE FROM ingredient_canonicals;
DELETE FROM tags;
DELETE FROM ingredient_categories;
DELETE FROM users;

INSERT INTO ingredient_categories (id, name) VALUES
('cat-meat','Мах'),
('cat-veg','Ногоо'),
('cat-spice','Амтлагч'),
('cat-dairy','Сүүн бүтээгдэхүүн'),
('cat-extra','Нэмэлт');

INSERT INTO tags (id, name) VALUES
('tg-quick','Quick'),
('tg-protein','High protein'),
('tg-party-mn','Найр, үдэшлэг'),
('tg-national-mn','Үндэсний баяр'),
('tg-naadam','Наадам'),
('tg-tsagaan-sar','Цагаан сар'),
('tg-feed-a-crowd','Олон хүнд (тоо тодорхойгүй)');

INSERT INTO ingredient_canonicals (id, name) VALUES
('cn-ku-chicken','тахиа'),
('cn-ku-udon','удон'),
('cn-ku-egg','өндөг'),
('cn-ku-onion','сонгино'),
('cn-ku-carrot','лууван'),
('cn-ku-bokchoy','байцай'),
('cn-ku-corn','эрдэнэ шиш'),
('cn-ku-soy','соёо соус'),
('cn-ku-redpepper','самжанг'),
('cn-ku-chili','чили соус'),
('cn-ku-oil','ургамлын тос'),
('cn-ku-kimchi','кимчи');

INSERT INTO ingredient_aliases (id, canonical_id, alias, normalized) VALUES
('al-ku-1','cn-ku-chicken','chicken breast','chicken breast'),
('al-ku-2','cn-ku-udon','udon noodles','udon noodles'),
('al-ku-3','cn-ku-soy','soy sauce','soy sauce');

INSERT INTO recipes (
  id, title, cuisine, prep_time, cook_time, difficulty,
  image_r2_key, description, tips, serves, is_published
) VALUES (
  'rec-korean-chicken-udon',
  'Солонгос маягийн Тахиа Удон Stir-fry',
  'Korean',
  15,
  20,
  2,
  '/recipe-images/chicken-udon-pan.png',
  'Эрүүл, амттай, 20 минутад бэлэн болох өндөр уургийн хоол',

'💪 Калори: ~550 ккал | Уураг: ~42г | Нүүрс ус: ~55г

✅ Соёо соус давслаг тул нэмэлт давс хэрэггүй!
✅ Кимчи пробиотик тул гэдэсний эрүүл мэндэнд сайн
✅ Удон нооделсийг хэт чанавал зөөлөрдөг тул болгоомжтой',

  1,
  1
);

INSERT INTO recipe_tags (recipe_id, tag_id) VALUES
('rec-korean-chicken-udon','tg-quick'),
('rec-korean-chicken-udon','tg-protein');

INSERT INTO ingredients (id, recipe_id, ingredient_canonical_id, name, quantity, unit, category_id, sort_order) VALUES
('iku-01','rec-korean-chicken-udon','cn-ku-chicken','Тахианы цээж мах',150,'г','cat-meat',1),
('iku-02','rec-korean-chicken-udon','cn-ku-udon','Удон нооделс',120,'г','cat-extra',2),
('iku-03','rec-korean-chicken-udon','cn-ku-egg','Өндөг',1,'ш','cat-dairy',3),
('iku-04','rec-korean-chicken-udon','cn-ku-onion','Ягаан сонгино',0.5,'аяга','cat-veg',4),
('iku-05','rec-korean-chicken-udon','cn-ku-carrot','Лууван',1,'ш','cat-veg',5),
('iku-06','rec-korean-chicken-udon','cn-ku-bokchoy','Бяцхан байцай',1,'аяга','cat-veg',6),
('iku-07','rec-korean-chicken-udon','cn-ku-corn','Sweet Corn (Hopeland)',3,'хоолны халбага','cat-extra',7),
('iku-08','rec-korean-chicken-udon','cn-ku-soy','Соёо соус',2,'хоолны халбага','cat-spice',8),
('iku-09','rec-korean-chicken-udon','cn-ku-redpepper','Самжанг',1,'цайны халбага','cat-spice',9),
('iku-10','rec-korean-chicken-udon','cn-ku-chili','Чили соус',1,'цайны халбага','cat-spice',10),
('iku-11','rec-korean-chicken-udon','cn-ku-oil','Ургамлын тос',1,'хоолны халбага','cat-extra',11),
('iku-12','rec-korean-chicken-udon','cn-ku-kimchi','Кимчи (хажуугийн)',0.5,'аяга','cat-extra',12);

INSERT INTO steps (id, recipe_id, step_order, description, description_template, timer_seconds, tip) VALUES
('sku-01','rec-korean-chicken-udon',1,'Соус бэлдэх: Жижиг аяганд 2 хоолны халбага Соёо соус, 1 цайны халбага Самжанг, 1 цайны халбага Чили соус хольж тавина. Энэ бол таны гол амтлагч болно.',NULL,NULL,NULL),
('sku-02','rec-korean-chicken-udon',2,'Удон нооделс чанах: Удон нооделсийг буцалсан усанд хийж чанана. Усыг шүүж, хүйтэн усаар зайлна.',NULL,NULL,'Хэт долго бол зөөлөрнө'),
('sku-03','rec-korean-chicken-udon',3,'Тахиа бэлдэх: 150 г тахианы цээж махыг нарийн зурлага болгож зүсэж, давс перецээр хөнгөхөн амтална.',NULL,NULL,NULL),
('sku-04','rec-korean-chicken-udon',4,'Ногоо зүсэх: Лууваныг нимгэн зүснэ. Ягаан сонгиныг том хэрчинэ. Бяцхан байцайг хугална. Sweet Corn (Hopeland)-ыг уснаас шүүнэ.',NULL,NULL,NULL),
('sku-05','rec-korean-chicken-udon',5,'Тахиа шарах: Тавган дээр ургамлын тос халааж, тахианы мах нэмж алтан өнгөтэй болтол шарна.',NULL,NULL,NULL),
('sku-06','rec-korean-chicken-udon',6,'Ногоо нэмэх: Лууван, ягаан сонгино нэмж 2 минут хутгаж шарна. Дараа нь бяцхан байцай нэмнэ.',NULL,120,NULL),
('sku-07','rec-korean-chicken-udon',7,'Нооделс + соус нэмэх: Чанасан нооделсийг нэмж, бэлдсэн соусаа асгана. Хүчтэй гал дээр 2 минут хутгана.',NULL,120,NULL),
('sku-08','rec-korean-chicken-udon',8,'Өндөг нэмэх: Голд нь зай гаргаж өндөг хугалж хийнэ. Тэр өндгийг хутгаж нооделстой холиулна.',NULL,NULL,NULL),
('sku-09','rec-korean-chicken-udon',9,'Sweet Corn нэмэх: Галыг унтрааж Sweet Corn нэмэх. Хольж тавган руу шилжүүлнэ.',NULL,NULL,NULL),
('sku-10','rec-korean-chicken-udon',10,'Кимчитэй хамт хүргэх: Тавган дээр хийж, хажууд 0.5 аяга Кимчи (хажуугийн) тавина. Халуун байхад идэнэ! 🍜',NULL,NULL,NULL);

INSERT INTO users (id, username, password_hash, role) VALUES (
  '00000000-0000-4000-8000-000000000001',
  'admin',
  '100000$7318d2aa3de1db72c415b354fa64f5c5$5ef3faa9a70fe7950642d217f7ead912169e0acaaa3410394a14da15ef846045',
  'admin'
);

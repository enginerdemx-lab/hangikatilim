-- 1. Önce eski/duplicate kayıtları temizle (Son görülme tarihine göre en günceli tut)
DELETE FROM push_subscriptions a USING (
    SELECT MIN(ctid) as ctid, token
    FROM push_subscriptions 
    GROUP BY token
    HAVING COUNT(*) > 1
) b
WHERE a.token = b.token 
AND a.ctid <> b.ctid;

-- 2. Eğer yukarısı karışık gelirse, direkt hepsini silip temiz sayfa açmak en garantisi:
-- DELETE FROM push_subscriptions;

-- 3. Token sütununa UNIQUE (Benzersiz) kısıtlaması ekle
-- Bu, aynı token'ın tekrar eklenmesini engeller, bunun yerine 'upsert' (güncelleme) çalışmasını sağlar.
ALTER TABLE push_subscriptions ADD CONSTRAINT unique_token_constraint UNIQUE (token);

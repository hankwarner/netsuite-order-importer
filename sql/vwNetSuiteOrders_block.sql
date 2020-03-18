USE [Micro_transactions]
GO

/****** Object:  View [dbo].[vwNetSuiteOrders_block]    Script Date: 3/18/2020 1:32:00 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE VIEW [dbo].[vwNetSuiteOrders_block]
AS
WITH x AS (SELECT DISTINCT
da.DiscountName,
da.OrderGroupId FROM Micro_transactions.dbo.DiscountsApplied da
)
,discounts AS (
SELECT DISTINCT OrderGroupId, DiscountNames  FROM x da
CROSS APPLY (SELECT 
	STUFF( (SELECT ',' + DiscountName
			FROM x da2
			WHERE da.OrderGroupId=da2.OrderGroupId
			ORDER BY DiscountName
			FOR XML PATH('') )
			,1,1,'')			
			) D ( DiscountNames)
)
SELECT     TOP (100) PERCENT dbo.csv_OrderGroup.order_number, OrderAddresses_1.Organization AS B_Company, OrderAddresses_1.FirstName AS B_FirstName, 
                      OrderAddresses_1.LastName AS B_LastName, OrderAddresses_1.Email, dbo.csv_OrderGroupAddresses.tel_number, OrderAddresses_1.Line1 AS B_Line1, 
                      OrderAddresses_1.Line2 AS B_Line2, OrderAddresses_1.City AS B_City, UPPER(OrderAddresses_1.RegionCode) AS B_State, 
                      OrderAddresses_1.PostalCode AS B_Zip, OrderAddresses_1.CountryCode AS B_Country, dbo.OrderAddresses.Organization AS S_Company, dbo.OrderAddresses.FirstName AS S_FirstName, 
                      dbo.OrderAddresses.LastName AS S_LastName, dbo.OrderAddresses.Line1 AS S_Line1, dbo.OrderAddresses.Line2 AS S_Line2, dbo.OrderAddresses.City AS S_City, 
                      UPPER(dbo.OrderAddresses.RegionCode) AS S_State, dbo.OrderAddresses.PostalCode AS S_Zip, dbo.OrderAddresses.CountryCode AS S_Country, 
                      dbo.OrderForms.Note, dbo.csv_OrderFormLineItems.quantity, fi.ItemName as Variant_SKU, fi.ItemName  AS Expr3, dbo.LineItems.ListPrice, 
                      CASE WHEN dbo.csv_OrderFormLineItems.quantity = 0 THEN 0 ELSE (dbo.LineItems.PlacedPrice * dbo.csv_OrderFormLineItems.quantity - dbo.LineItems.OrderLevelDiscountAmount
                       - dbo.LineItems.LineItemDiscountAmount) / dbo.csv_OrderFormLineItems.quantity END AS ActualProductTotal, 
                      dbo.LineItems.PlacedPrice * dbo.csv_OrderFormLineItems.quantity AS ProductTotal, dbo.OrderForms.TaxTotal, 
                      dbo.OrderForms.ShippingTotal + dbo.OrderForms.HandlingTotal AS SH, dbo.OrderForms.Total, 
                      'Discover' AS PaymentMethodName, 
                      'Credit Card' AS Expr1, dbo.LineItems.OrderLevelDiscountAmount
                     ,dbo.csv_OrderFormLineItems.description  

                      ,CASE WHEN ShippingMethodName = 'Second-Day Air' THEN 'UPS 2nd Day Air' WHEN ShippingMethodName = 'Next-Day Air' THEN 'UPS Next Day Air' ELSE 'UPS Ground'
                       END AS ShippingMethodName, dbo.GetLocalFromUTC(dbo.PurchaseOrders.Created) AS d_DateCreated, dbo.GetLocalFromUTC(dbo.PurchaseOrders.LastModified) 
                      AS d_DateLastChanged 
					  , CASE WHEN dbo.LineItems.CustomDisplayName IS  NULL THEN dbo.LineItems.DisplayName ELSE dbo.LineItems.CustomDisplayName END AS DisplayName
					  , dbo.PurchaseOrders.Status, 
                      CASE WHEN ShippingMethodName = 'Second-Day Air' THEN 'True' WHEN ShippingMethodName = 'Next-Day Air' THEN 'True' WHEN Expedited IS NULL 
                      THEN 'False' ELSE Expedited END AS Expedited, dbo.LineItems.Site, dbo.OrderForms.CheckoutType, Micro_profiles.dbo.vwUserObjects.u_email_address, 
                      fi.ItemID as Variant_NetSuiteID, COALESCE (Micro_CustomJobs.dbo.tblCheckoutUserTypeDropDown.UserType, N'none') AS UserType, 
                      Micro_CustomJobs.dbo.tblCheckoutUserTypeDropDown.OtherDescription,dbo.LineItems.ProductCatalog,OrderForms.JobName,
                      dbo.LineItems.Custom_LI1 AS ItemNotes,dbo.LineItems.Custom_LI2 AS CustomNetSuiteID,discounts.DiscountNames,dbo.OrderForms.AltOrderNumber,
					  dbo.LineItems.Custom_LI3 AS ItemIndex,dbo.OrderForms.Custom_OF1 AS IPAddress,
					  dbo.OrderForms.Custom_OF2 AS RelatedEstimate
FROM         dbo.OrderAddresses with(nolock) INNER JOIN
                      dbo.csv_OrderFormLineItems with(nolock) INNER JOIN
                      dbo.csv_OrderGroup with(nolock) ON dbo.csv_OrderFormLineItems.OrderGroup_id = dbo.csv_OrderGroup.ordergroup_id INNER JOIN
                      dbo.csv_OrderGroupAddresses with(nolock) ON dbo.csv_OrderFormLineItems.shipping_address_id = dbo.csv_OrderGroupAddresses.address_id ON 
                      dbo.OrderAddresses.OrderAddressId = dbo.csv_OrderGroupAddresses.address_id AND 
                      dbo.OrderAddresses.OrderGroupId = dbo.csv_OrderFormLineItems.OrderGroup_id AND 
                      dbo.OrderAddresses.OrderGroupId = dbo.csv_OrderGroupAddresses.OrderGroup_id INNER JOIN
                      dbo.OrderForms with(nolock) ON dbo.OrderAddresses.OrderGroupId = dbo.OrderForms.OrderGroupId INNER JOIN
                      dbo.LineItems with(nolock) ON dbo.OrderForms.OrderFormId = dbo.LineItems.OrderFormId AND dbo.csv_OrderFormLineItems.lineitem_id = dbo.LineItems.LineItemId INNER JOIN
                      dbo.OrderAddresses AS OrderAddresses_1 with(nolock) ON dbo.OrderAddresses.OrderGroupId = OrderAddresses_1.OrderGroupId AND OrderAddresses_1.Name='billing' INNER JOIN
                      dbo.PurchaseOrders with(nolock) ON dbo.OrderAddresses.OrderGroupId = dbo.PurchaseOrders.OrderGroupId AND 
                      dbo.OrderForms.OrderGroupId = dbo.PurchaseOrders.OrderGroupId AND OrderAddresses_1.OrderGroupId = dbo.PurchaseOrders.OrderGroupId LEFT OUTER JOIN
                      Micro_CustomJobs.dbo.tblCheckoutUserTypeDropDown with(nolock) ON 
                      OrderAddresses_1.Email = Micro_CustomJobs.dbo.tblCheckoutUserTypeDropDown.EmailAddress LEFT OUTER JOIN
                      Micro_profiles.dbo.vwUserObjects with(nolock) ON dbo.PurchaseOrders.SoldToId = Micro_profiles.dbo.vwUserObjects.u_user_id LEFT OUTER JOIN
					  Micro_CustomJobs.HmwallaceDW.FactInventory fi with(nolock) ON
                      LTRIM(RTRIM(STR(fi.ItemId))) + '(Live)' = dbo.csv_OrderFormLineItems.product_variant_id LEFT OUTER JOIN
                      discounts with(nolock) ON dbo.PurchaseOrders.OrderGroupId=discounts.OrderGroupId
WHERE     (dbo.PurchaseOrders.Created > DATEADD(DAY, - 30, GETDATE()))

GO

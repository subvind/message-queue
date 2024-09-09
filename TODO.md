allow usage of redis or isdb (default) for durability

save ismq info to sqlite database
allow data to be viewed over rest api
use rest api to serve htmx app backed

api:
ismq should work for each tenant on bm:
http://<tenantId>.ismq.tenant.subvind.com/api/exchanges
http://<tenantId>.ismq.tenant.subvind.com/api/queues
http://<tenantId>.ismq.tenant.subvind.com/api/subscribers

ui:
list: subvind.com/exchanges
list: subvind.com/queues
list: subvind.com/subscribers
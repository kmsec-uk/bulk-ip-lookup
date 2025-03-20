# Yet another bulk IP enrichment tool

This provides a HTTPS shim for Team Cymru's bulk IP mapping service.

Team Cymru's bulk IP mapping service is super convenient and capable, but you need to use netcat and interact with port 43 to use it, which isn't always feasible in locked down environments.

This provides a HTTPS interface that generates a HTML table or JSON via API.

* JSON: `/api/?ips=1.1.1.1,8.8.8.8`

```json
{
  "banner": "Bulk mode; whois.cymru.com [2025-03-20 10:04:02 +0000]",
  "results": [
    {
      "ip": "1.1.1.1",
      "as": "13335",
      "asn": "CLOUDFLARENET, US",
      "bgp_prefix": "1.1.1.0/24",
      "cc": "AU",
      "registry": "apnic",
      "allocated": "2011-08-11"
    },
    {
      "ip": "8.8.8.8",
      "as": "15169",
      "asn": "GOOGLE, US",
      "bgp_prefix": "8.8.8.0/24",
      "cc": "US",
      "registry": "arin",
      "allocated": "2023-12-28"
    }
  ]
}
```

* HTPPS: `/?ips=1.1.1.1,8.8.8.8`



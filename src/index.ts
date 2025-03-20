import { connect } from 'cloudflare:sockets'
//@ts-expect-error
import index from "./index.html"
//@ts-expect-error
import picocss from "./pico.min.css.txt"

type Enriched = {
	ip: string,
	as: string,
	asn: string,
	bgp_prefix: string,
	cc: string,
	registry: string,
	allocated: string,
}
type Result = {
	banner: string
	results : Enriched[]

}


const genPayload = (ips: string[]): string => {
	return `begin
header
verbose
${ips.join("\n")}
end
`
}

const genTable = (enriched: Enriched[]): string => {
	return `<table>
	<thead>
		<tr>
			<th>ip</th>
			<th>as</th>
			<th>asn</th>
			<th>bgp_prefix</th>
			<th>cc</th>
			<th>registry</th>
			<th>allocated</th>
		</tr>
	</thead>
	<tbody>
	${enriched.map(item => { return `<tr>
		<td>${item.ip}</td>
		<td>${item.as}</td>
		<td>${item.asn}</td>
		<td>${item.bgp_prefix}</td>
		<td>${item.cc}</td>
		<td>${item.registry}</td>
		<td>${item.allocated}</td>
		</tr>`
	}).join("\r\n")}
	</tbody>
</table>`
}


const enrich = async (ips:string[]): Promise<Result> => {
	const payload = genPayload(ips)

	const socket = connect({
		hostname: "whois.cymru.com",
		port: 43
	})


	const writer = socket.writable.getWriter()
	const encoder = new TextEncoder()
	const encoded = encoder.encode(payload)
	await writer.write(encoded)

	let responseText = ""
	for await (const chunk of socket.readable.pipeThrough(new TextDecoderStream())) {
		responseText += chunk
	}

	const results = responseText.trim().split(/\r?\n/)
	const banner = results.shift() as string

	socket.close()

	return {
		banner: banner,
		results: results.filter(item => !item.startsWith("Error:")).map(content => {
			const [as, ip, bgp_prefix, cc, registry, allocated, asn] = content.split("|").map(cell => cell.trim())
			return {
				ip: ip,
				as: as,
				asn: asn,
				bgp_prefix: bgp_prefix,
				cc: cc,
				registry: registry,
				allocated: allocated,
			}
		})
	}
}

export default {
	async fetch(request: Request) {

		const url = new URL(request.url)
		const params = url.searchParams
		const ipsParam = params.get("ips")

		switch (url.pathname) {
			case "/":
				if (!ipsParam) {
					return new Response(index, {headers: {"content-type": "text/html"}})
				}
				const ips = ipsParam.trim().split(",").filter(ip => !!ip)
				const enriched = await enrich(ips)
				const content = genTable(enriched.results)
				console.log(content)
				return new Response(index.replace(/\<!--content--\>.*\<!--content--\>/, content), {headers: {"content-type": "text/html"}})
			case "/pico.min.css":
				return new Response(picocss, {headers: {"content-type": "text/css"}})
			case "/api":
			case "/api/":
				break
			case "/robots.txt":
				return new Response(`User-agent: *
Allow: /`)
			default:
				return new Response("not found", {status:404})
		}

		if (!ipsParam) {
			return new Response(`IPs must be specified in the ips parameter.\r\ne.g. ${url.protocol}://${url.host}/?ips=1.1.1.1`, { status: 400 })
		}

		const ips = ipsParam.trim().split(",").filter(ip => !!ip)

		return Response.json(await enrich(ips));
	},
} satisfies ExportedHandler;

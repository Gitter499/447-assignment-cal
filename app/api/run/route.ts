export const dynamic = 'force-dynamic'; // static by default, unless reading the request
import { parse, NodeType } from "node-html-parser"
import { put } from "@vercel/blob"
import { NextResponse } from 'next/server';
import * as ics from "ics"
import parser from "any-date-parser"

export async function GET(request: Request) {
  // fetch Jarret's website

  const res = await fetch("https://jarrettbillingsley.github.io/teaching/classes/cs0447/assignments.html")

  const code = await res.text()

  const root = parse(code)

  const work = root.querySelector("html > body > .page-content")


  // Parse out assingnments
  const assignments = work?.querySelectorAll("li")
    ?.map((a, index) => ({ title: a.childNodes[0].innerText, dueDate: parser.fromString(a.childNodes.filter(n => n.nodeType == NodeType.TEXT_NODE).map(n => n.textContent).join("")) }))

  const events: ics.EventAttributes[] = []
  for (const a of assignments!) {
    const event: ics.EventAttributes = {
      title: a.title,
      startInputType: "utc",
      start: a.dueDate.toUTCString(),
      duration: {
        minutes: 1
      }
    }

    events.push(event)

  }

  let blob

  ics.createEvents(events, async (err, value) => {
    if (err) {
      console.error(err)

      return NextResponse.json("Oh crap")
    }

    blob = await put("447-cal.ics", value, {
      access: "public"
    })


  })


  return NextResponse.json(blob)
}

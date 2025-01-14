export const dynamic = 'force-dynamic'; // static by default, unless reading the request
import { parse, NodeType } from "node-html-parser"
import { del, getDownloadUrl, put, PutBlobResult } from "@vercel/blob"
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
    ?.map((a, index) => ({ title: a.childNodes[0].innerText, dueDate: parser.fromString(a.childNodes.filter(n => n.nodeType == NodeType.TEXT_NODE).map(n => n.textContent).join("")), link: a.querySelector("a")?.getAttribute("href") }))

  let events: ics.EventAttributes[] = []
  for (const a of assignments!) {
    const date = a.dueDate
    const event: ics.EventAttributes = {
      title: a.title,
      // Super weird behavior with date.getDay()
      start: [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes()],
      // This has huge potential of breaking but as long as stuff is due at 9:00 PM I don't have to think about it
      duration: {
        minutes: 0
      },
      classification: "PUBLIC",
      sequence: 0,
      url: `https://jarrettbillingsley.github.io${a.link}`, 
      description: `[Link] (https://jarrettbillingsley.github.io${a.link})`
    }

    console.log([date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes()],)


    events.push(event)

  }

  let val: string = ""
  ics.createEvents(events, async (err, value) => {
    if (err) {
      console.error(err)

      return NextResponse.json("Oh crap")
    }
    val = value
  })

  console.log(val)

  // Make sure to delete because overwrites are not supported

  const blob = await put("cal/447-cal.ics", val, {
    access: "public",
    addRandomSuffix: false,
    cacheControlMaxAge:0
  })


  return NextResponse.json(blob)
}

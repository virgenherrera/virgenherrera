---
company: 3Pillar Global (formerly Tiempo Development)
role: Fullstack Software Engineer
startDate: '2016-10'
endDate: '2018-10'
skills:
  - javascript
  - nodejs
  - expressjs
  - mongodb
  - aws
  - dotnet-framework
  - php
  - graphql
  - jenkins
  - mocha
  - chai
  - istanbul
  - api-design
  - openapi
  - middleware-patterns
  - postgresql
  - typeorm
engagements:
  - title: Senior Living Emergency Response System
    domain: Healthcare / Assisted Living
    client: Senior Living Software Company
    skills:
      - nodejs
      - websocket
    description:
      - 'The client''s emergency response system for assisted living facilities relied on UDP-based data from help buttons and door/window sensors: packets were being silently dropped due to UDP''s unreliable delivery, while web and iOS clients polled every 30 seconds to simulate "real-time" alerts. In a system where a missed alert means a vulnerable resident does not receive help, both problems were life-safety defects.'
      - '*Diagnosed a life-safety defect in the emergency alert pipeline (UDP packet loss combined with 30-second polling) and implemented Node.js with Socket.IO to deliver true real-time event streaming over TCP/WebSocket, eliminating both data loss and response delay.'
      - "*Built a push notification system alerting caretakers when they left the facility's LAN boundary, closing a critical coverage gap in the elder care safety system."
  - title: Online IT Training Content Platform
    domain: EdTech / Content Delivery
    client: Online IT Training Platform
    skills:
      - nodejs
      - expressjs
      - mongodb
      - aws
      - graphql
      - mocha
      - chai
      - istanbul
      - jenkins
    description:
      - 'The client needed to modernize a legacy backend built on PHP and .NET Framework to support growing API request volume from frontend and mobile clients.'
      - '*Modernized a legacy PHP and .NET Framework backend to Node.js and Express.js with MongoDB on AWS, replacing an aging stack with a scalable microservices architecture.'
      - '*Designed a GraphQL API Gateway that reduced client-side API requests by 60% for frontend and mobile views, directly improving page load performance.'
      - '*Established automated testing (Mocha, Chai, Istanbul) integrated into Jenkins CI/CD pipelines, enforcing quality gates on every deployment.'
---

Delivered Node.js, Express.js, MongoDB, and GraphQL-based microservices at 3Pillar Global, including a life-safety-critical emergency response platform for assisted living facilities and a legacy backend modernization initiative for an online IT training platform, following Agile/Scrum and Lean methodologies with a strong emphasis on scalability, reliability, and delivery quality.

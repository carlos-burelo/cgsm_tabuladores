const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  const department = await db.department.upsert({
    where: { name: "Contabilidad" },
    update: {},
    create: {
      name: "Contabilidad",
      description: "Departamento de Contabilidad",
      isActive: true,
    },
  });

  console.log(`Department created: ${department.id}`);

  const user = await db.user.upsert({
    where: { email: "contador@example.com" },
    update: {},
    create: {
      email: "contador@example.com",
      name: "Juan Contador",
      password: "hashed_password",
      role: "user",
      departmentId: department.id,
      isActive: true,
    },
  });

  console.log(`User created: ${user.id}`);

  const jefe = await db.user.upsert({
    where: { email: "jefe@example.com" },
    update: {},
    create: {
      email: "jefe@example.com",
      name: "María Jefe",
      password: "hashed_password",
      role: "manager",
      departmentId: department.id,
      isActive: true,
    },
  });

  console.log(`Manager created: ${jefe.id}`);

  const flow = await db.flow.upsert({
    where: {
      departmentId_name_version: {
        departmentId: department.id,
        name: "Orden de Pago",
        version: 1,
      },
    },
    update: {},
    create: {
      name: "Orden de Pago",
      description: "Flujo para aprobación de órdenes de pago",
      version: 1,
      departmentId: department.id,
      isActive: true,
    },
  });

  console.log(`Flow created: ${flow.id}`);

  const startNode = await db.flowNode.create({
    data: {
      flowId: flow.id,
      nodeId: "start",
      type: "start",
      label: "Inicio",
      positionX: 100,
      positionY: 100,
      config: { isStart: true },
      isStart: true,
    },
  });

  const approvalNode = await db.flowNode.create({
    data: {
      flowId: flow.id,
      nodeId: "approval",
      type: "signature",
      label: "Aprobación de Jefe",
      positionX: 300,
      positionY: 100,
      config: {
        type: "signature",
        assignedTo: [jefe.id],
        requiresSignature: true,
      },
    },
  });

  const endNode = await db.flowNode.create({
    data: {
      flowId: flow.id,
      nodeId: "end",
      type: "end",
      label: "Finalizado",
      positionX: 500,
      positionY: 100,
      config: { isEnd: true },
      isEnd: true,
    },
  });

  console.log("Flow nodes created");

  await db.flowEdge.create({
    data: {
      flowId: flow.id,
      edgeId: "edge-1",
      sourceId: startNode.id,
      targetId: approvalNode.id,
    },
  });

  await db.flowEdge.create({
    data: {
      flowId: flow.id,
      edgeId: "edge-2",
      sourceId: approvalNode.id,
      targetId: endNode.id,
    },
  });

  console.log("Flow edges created");

  await db.notificationPreference.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      email: true,
      inApp: true,
      taskAssigned: true,
      taskCompleted: true,
      instanceCompleted: true,
    },
  });

  await db.notificationPreference.upsert({
    where: { userId: jefe.id },
    update: {},
    create: {
      userId: jefe.id,
      email: true,
      inApp: true,
      taskAssigned: true,
      taskCompleted: true,
      instanceCompleted: true,
    },
  });

  console.log("Notification preferences created");
  console.log("Database seeding completed successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

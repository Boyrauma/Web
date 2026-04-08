import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin@123456", 10);

  await prisma.adminUser.upsert({
    where: { email: "admin@dinhdung.local" },
    update: {},
    create: {
      email: "admin@dinhdung.local",
      passwordHash,
      fullName: "Quản trị hệ thống"
    }
  });

  const categories = [
    {
      name: "Xe 4 chỗ",
      slug: "xe-4-cho",
      description: "Phù hợp cá nhân, cặp đôi và công tác nhỏ",
      sortOrder: 0
    },
    {
      name: "Xe 7 chỗ",
      slug: "xe-7-cho",
      description: "Phù hợp gia đình và công tác",
      sortOrder: 1
    },
    {
      name: "Xe 16 chỗ",
      slug: "xe-16-cho",
      description: "Tối ưu cho đoàn vừa",
      sortOrder: 2
    },
    {
      name: "Xe 29-35 chỗ",
      slug: "xe-29-35-cho",
      description: "Phù hợp đoàn lớn, du lịch, lễ hội",
      sortOrder: 3
    },
    {
      name: "Xe 45 chỗ",
      slug: "xe-45-cho",
      description: "Phù hợp đoàn lớn, tour dài ngày và sự kiện quy mô lớn",
      sortOrder: 4
    }
  ];

  for (const category of categories) {
    await prisma.vehicleCategory.upsert({
      where: { slug: category.slug },
      update: category,
      create: category
    });
  }

  const xe7 = await prisma.vehicleCategory.findUniqueOrThrow({
    where: { slug: "xe-7-cho" }
  });
  const xe16 = await prisma.vehicleCategory.findUniqueOrThrow({
    where: { slug: "xe-16-cho" }
  });
  const xe35 = await prisma.vehicleCategory.findUniqueOrThrow({
    where: { slug: "xe-29-35-cho" }
  });

  const vehicles = [
    {
      categoryId: xe7.id,
      name: "Toyota Innova",
      slug: "toyota-innova",
      seatCount: 7,
      shortDescription: "Xe 7 chỗ sạch sẽ, phù hợp gia đình",
      description: "Phục vụ du lịch, công tác, sân bay.",
      features: ["Máy lạnh", "Ghế rộng", "Khoang hành lý tốt"],
      isFeatured: true
    },
    {
      categoryId: xe16.id,
      name: "Ford Transit",
      slug: "ford-transit",
      seatCount: 16,
      shortDescription: "Xe 16 chỗ trần cao, đi đường dài thoải mái",
      description: "Phù hợp đoàn khách, sự kiện, du lịch.",
      features: ["Máy lạnh", "Ghế ngả", "Không gian thoáng"],
      isFeatured: true
    },
    {
      categoryId: xe35.id,
      name: "County 29 chỗ",
      slug: "county-29-cho",
      seatCount: 29,
      shortDescription: "Xe đoàn lớn đời mới, phuộc hơi êm ái",
      description: "Phù hợp lễ hội, hành hương, tuyến dài.",
      features: ["Phuộc hơi", "Khoang chứa đồ", "Âm thanh giải trí"],
      isFeatured: true
    }
  ];

  for (const vehicle of vehicles) {
    await prisma.vehicle.upsert({
      where: { slug: vehicle.slug },
      update: vehicle,
      create: vehicle
    });
  }

  const services = [
    { title: "Thuê xe du lịch", slug: "thue-xe-du-lich", sortOrder: 1 },
    { title: "Xe cưới hỏi", slug: "xe-cuoi-hoi", sortOrder: 2 },
    { title: "Đưa đón sân bay", slug: "dua-don-san-bay", sortOrder: 3 },
    { title: "Hợp đồng dài hạn", slug: "hop-dong-dai-han", sortOrder: 4 }
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: service,
      create: service
    });
  }

  const settings = [
    { key: "site_name", value: "Nhà xe Định Dung", group: "branding" },
    { key: "site_tagline", value: "Dịch vụ vận tải Thanh Hóa", group: "branding" },
    { key: "browser_title", value: "Nhà xe Định Dung | Website nhà xe", group: "branding" },
    { key: "logo_url", value: "", group: "branding" },
    { key: "favicon_url", value: "/favicon.svg", group: "branding" },
    { key: "hotline", value: "0979860498", group: "contact" },
    { key: "zalo", value: "https://zalo.me/0979860498", group: "contact" },
    { key: "address", value: "555 Quang Trung 2, Phường Hạc Thành, Thanh Hóa", group: "contact" },
    { key: "hero_title", value: "Vạn dặm bình an, trọn vẹn niềm tin", group: "homepage" },
    {
      key: "hero_subtitle",
      value: "Chuyên xe 7 chỗ, 16 chỗ, 29-35 chỗ cho du lịch, cưới hỏi, sự kiện và đưa đón sân bay tại Thanh Hóa.",
      group: "homepage"
    },
    {
      key: "footer_text",
      value: "Dịch vụ thuê xe du lịch, cưới hỏi, sân bay và hợp đồng tại Thanh Hóa.",
      group: "branding"
    },
    { key: "telegram_enabled", value: "false", group: "notifications" },
    { key: "telegram_bot_token", value: "", group: "notifications" },
    { key: "telegram_chat_id", value: "", group: "notifications" },
    { key: "telegram_chat_id_system", value: "", group: "notifications" },
    { key: "telegram_chat_id_booking_created", value: "", group: "notifications" },
    { key: "telegram_chat_id_booking_updated", value: "", group: "notifications" },
    { key: "telegram_chat_id_booking_deleted", value: "", group: "notifications" },
    { key: "telegram_notify_booking_created", value: "true", group: "notifications" },
    { key: "telegram_notify_booking_updated", value: "true", group: "notifications" },
    { key: "telegram_notify_booking_deleted", value: "false", group: "notifications" }
  ];

  for (const setting of settings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting
    });
  }

  const allVehicles = await prisma.vehicle.findMany({
    select: {
      id: true,
      slug: true
    }
  });

  const vehicleMap = Object.fromEntries(allVehicles.map((vehicle) => [vehicle.slug, vehicle.id]));

  const vehicleImages = [
    {
      vehicleSlug: "toyota-innova",
      imageUrl: "/uploads/vehicles/xe7cho.png",
      altText: "Toyota Innova",
      isPrimary: true,
      sortOrder: 0
    },
    {
      vehicleSlug: "toyota-innova",
      imageUrl: "/uploads/vehicles/xe7cho2.png",
      altText: "Toyota Innova phụ",
      isPrimary: false,
      sortOrder: 1
    },
    {
      vehicleSlug: "ford-transit",
      imageUrl: "/uploads/vehicles/xe16cho.png",
      altText: "Ford Transit",
      isPrimary: true,
      sortOrder: 0
    },
    {
      vehicleSlug: "ford-transit",
      imageUrl: "/uploads/vehicles/xe16cho2.png",
      altText: "Ford Transit phụ",
      isPrimary: false,
      sortOrder: 1
    },
    {
      vehicleSlug: "county-29-cho",
      imageUrl: "/uploads/vehicles/xecountybonghoi.png",
      altText: "County 29 chỗ",
      isPrimary: true,
      sortOrder: 0
    },
    {
      vehicleSlug: "county-29-cho",
      imageUrl: "/uploads/vehicles/xecountybonghoi2.png",
      altText: "County 29 chỗ phụ",
      isPrimary: false,
      sortOrder: 1
    }
  ];

  for (const image of vehicleImages) {
    const vehicleId = vehicleMap[image.vehicleSlug];

    if (!vehicleId) {
      continue;
    }

    const existingImage = await prisma.vehicleImage.findFirst({
      where: {
        vehicleId,
        imageUrl: image.imageUrl
      }
    });

    if (existingImage) {
      await prisma.vehicleImage.update({
        where: { id: existingImage.id },
        data: {
          altText: image.altText,
          isPrimary: image.isPrimary,
          sortOrder: image.sortOrder
        }
      });
      continue;
    }

    await prisma.vehicleImage.create({
      data: {
        vehicleId,
        imageUrl: image.imageUrl,
        altText: image.altText,
        isPrimary: image.isPrimary,
        sortOrder: image.sortOrder
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

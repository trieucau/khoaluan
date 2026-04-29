import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import db from '../models/index';
import { Op } from 'sequelize';
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// FUNCTION DECLARATIONS — Gemini tự chọn gọi khi cần
const functionDeclarations = [
  // ── PRODUCTS ─────────────────────────────────────────────
  {
    name: 'searchProducts',
    description:
      'Tìm kiếm sản phẩm theo tên, danh mục hoặc thương hiệu. Dùng khi user hỏi về sản phẩm, giá cả, gợi ý mua hàng, tìm đồ.',
    parameters: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: 'Từ khoá tìm theo tên sản phẩm',
        },
        categoryCode: {
          type: 'string',
          description: 'Mã danh mục (code trong Allcode)',
        },
        brandCode: {
          type: 'string',
          description: 'Mã thương hiệu (code trong Allcode)',
        },
        limit: { type: 'number', description: 'Số lượng trả về, mặc định 5' },
      },
      required: [],
    },
  },
  {
    name: 'getProductDetail',
    description:
      'Lấy chi tiết đầy đủ 1 sản phẩm: các biến thể màu/mẫu, size, giá gốc, giá sale, chất liệu. Dùng khi user hỏi sâu về 1 sản phẩm cụ thể.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'number', description: 'ID sản phẩm' },
      },
      required: ['productId'],
    },
  },
  {
    name: 'getProductReviews',
    description:
      'Lấy đánh giá (review/comment) của sản phẩm kèm số sao. Dùng khi user hỏi sản phẩm có tốt không, review thế nào.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'number', description: 'ID sản phẩm' },
        limit: { type: 'number', description: 'Số review lấy, mặc định 5' },
      },
      required: ['productId'],
    },
  },
  {
    name: 'getCategories',
    description:
      'Lấy danh sách tất cả danh mục và thương hiệu của shop. Dùng khi user hỏi shop bán loại hàng gì, có những brand nào.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },

  // ── ORDERS (chỉ của user đang chat) ──────────────────────
  {
    name: 'getMyOrders',
    description:
      'Lấy danh sách đơn hàng của chính user đang chat. Dùng khi hỏi đơn đang ở đâu, trạng thái giao hàng, lịch sử mua.',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Số đơn lấy, mặc định 5' },
        statusCode: {
          type: 'string',
          description: 'Lọc theo trạng thái: S3=chờ xử lý, S4=đang giao, S5=đã giao, S6=đã huỷ',
        },
      },
      required: [],
    },
  },
  {
    name: 'getOrderDetail',
    description:
      'Lấy chi tiết 1 đơn hàng cụ thể: sản phẩm, số lượng, giá. Dùng khi user hỏi đơn hàng X có gì.',
    parameters: {
      type: 'object',
      properties: {
        orderId: { type: 'number', description: 'ID đơn hàng' },
      },
      required: ['orderId'],
    },
  },

  // ── CART (chỉ của user đang chat) ────────────────────────
  {
    name: 'getMyCart',
    description:
      'Xem giỏ hàng hiện tại của user. Dùng khi user hỏi giỏ hàng của tôi có gì, tổng giỏ hàng bao nhiêu.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },

  // ── VOUCHERS ─────────────────────────────────────────────
  {
    name: 'getAvailableVouchers',
    description:
      'Lấy danh sách voucher/mã giảm giá còn hiệu lực. Dùng khi user hỏi về khuyến mãi, giảm giá, mã coupon.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },

  // ── SHIPPING ─────────────────────────────────────────────
  {
    name: 'getShippingOptions',
    description:
      'Lấy các loại vận chuyển và phí ship. Dùng khi user hỏi phí ship bao nhiêu, ship nhanh, ship tiêu chuẩn.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },

  // ── BLOG ─────────────────────────────────────────────────
  {
    name: 'getBlogs',
    description:
      'Lấy các bài viết/tin tức của shop. Dùng khi user hỏi về bài viết, xu hướng thời trang, tips mặc đồ.',
    parameters: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: 'Từ khoá tìm trong tiêu đề bài viết',
        },
        limit: { type: 'number', description: 'Số bài lấy, mặc định 3' },
      },
      required: [],
    },
  },

  // ── BANNERS / PROMOTIONS ──────────────────────────────────
  {
    name: 'getCurrentPromotions',
    description:
      'Lấy banner/chương trình khuyến mãi đang chạy. Dùng khi user hỏi shop có sale gì, chương trình ưu đãi.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },

  // ── L2: CART CHI TIẾT ────────────────────────────────────
  {
    name: 'getCartByUser',
    description:
      'Xem giỏ hàng hiện tại của user kèm tên sản phẩm, size, màu, giá từng món và tổng tiền. ' +
      'Dùng khi user hỏi "giỏ hàng tôi có gì", "tổng giỏ hàng bao nhiêu", "tôi đang giữ mấy sản phẩm".',
    parameters: { type: 'object', properties: {}, required: [] },
  },

  // ── L2: TỒN KHO ──────────────────────────────────────────
  {
    name: 'checkProductStock',
    description:
      'Kiểm tra sản phẩm còn size / màu / biến thể nào. ' +
      'Dùng khi user hỏi "còn size M không", "màu đen còn hàng không", "sản phẩm X còn không".',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'number', description: 'ID sản phẩm cần kiểm tra' },
        productDetailId: {
          type: 'number',
          description: 'ID biến thể cụ thể (màu/mẫu), nếu biết',
        },
      },
      required: ['productId'],
    },
  },

  // ── L2: REVIEW CHI TIẾT ──────────────────────────────────
  {
    name: 'getDetailedReviews',
    description:
      'Lấy các nhận xét/đánh giá chi tiết của sản phẩm kèm số sao và nội dung. ' +
      'Dùng khi user hỏi "review sản phẩm này thế nào", "có ai mua chưa", "chất lượng ra sao".',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'number', description: 'ID sản phẩm' },
        minStar: {
          type: 'number',
          description: 'Lọc từ số sao tối thiểu (1-5), mặc định 1',
        },
        limit: { type: 'number', description: 'Số review lấy, mặc định 5' },
      },
      required: ['productId'],
    },
  },

  // ── L2: THÔNG TIN CÁ NHÂN USER ───────────────────────────
  {
    name: 'getUserProfile',
    description:
      'Lấy thông tin cá nhân của user đang chat: tên, địa chỉ mặc định. ' +
      'Dùng khi user hỏi "thông tin tài khoản của tôi", "địa chỉ mặc định của tôi là gì".',
    parameters: { type: 'object', properties: {}, required: [] },
  },

  // ── L2: CHI TIẾT ĐƠN HÀNG ĐẦY ĐỦ ────────────────────────
  {
    name: 'getFullOrderDetail',
    description:
      'Lấy chi tiết đầy đủ 1 đơn hàng: từng sản phẩm, số lượng, giá, loại ship, trạng thái. ' +
      'Dùng khi user hỏi "đơn #123 có gì", "đơn hàng của tôi gồm những gì".',
    parameters: {
      type: 'object',
      properties: {
        orderId: { type: 'number', description: 'ID đơn hàng' },
      },
      required: ['orderId'],
    },
  },

  // ── L2: THEO DÕI SHIPPER ─────────────────────────────────
  {
    name: 'trackShipperLocation',
    description:
      'Kiểm tra trạng thái giao hàng và shipper đang giao đơn có đang online không. ' +
      'Dùng khi user hỏi "shipper đang ở đâu", "đơn của tôi đang được giao chưa", "bao giờ tới nơi".',
    parameters: {
      type: 'object',
      properties: {
        orderId: { type: 'number', description: 'ID đơn hàng đang giao' },
      },
      required: ['orderId'],
    },
  },
];

// FUNCTION IMPLEMENTATIONS
// ── PRODUCTS ─────────────────────────────────────────────────
const searchProducts = async ({ keyword = '', categoryCode, brandCode, limit = 5 }) => {
  try {
    const where = { statusId: 'S1' };
    if (categoryCode) where.categoryId = categoryCode;
    if (brandCode) where.brandId = brandCode;
    if (keyword) where.name = { [Op.like]: `%${keyword}%` };

    const products = await db.Product.findAll({
      where,
      include: [
        {
          model: db.ProductDetail,
          as: 'productDetailData',
          attributes: ['id', 'nameDetail', 'originalPrice', 'discountPrice'],
          limit: 3,
        },
        { model: db.Allcode, as: 'categoryData', attributes: ['value'] },
        { model: db.Allcode, as: 'brandData', attributes: ['value'] },
      ],
      limit,
      raw: false,
    });

    if (!products.length) return { found: false, message: `Không tìm thấy sản phẩm "${keyword}"` };

    return {
      found: true,
      total: products.length,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.categoryData?.value,
        brand: p.brandData?.value,
        material: p.material,
        madeby: p.madeby,
        variants: p.productDetailData?.map((d) => ({
          id: d.id,
          name: d.nameDetail,
          originalPrice: Number(d.originalPrice),
          discountPrice: Number(d.discountPrice),
          saving: Number(d.originalPrice) - Number(d.discountPrice),
        })),
        lowestPrice: Math.min(...(p.productDetailData?.map((d) => Number(d.discountPrice)) || [0])),
      })),
    };
  } catch (err) {
    return { error: 'Không thể tìm sản phẩm', detail: err.message };
  }
};

const getProductDetail = async ({ productId }) => {
  try {
    const product = await db.Product.findOne({ where: { id: productId }, raw: true });
    if (!product) return { found: false };

    const details = await db.ProductDetail.findAll({
      where: { productId },
      raw: true,
    });

    const variants = await Promise.all(
      details.map(async (d) => {
        const sizes = await db.ProductDetailSize.findAll({
          where: { productdetailId: d.id },
          raw: true,
        });

        return {
          id: d.id,
          name: d.nameDetail,
          originalPrice: Number(d.originalPrice),
          discountPrice: Number(d.discountPrice),
          sizes: sizes.map((s) => ({
            size: s.sizeId,
            width: s.width,
            height: s.height,
            weight: s.weight,
          })),
        };
      })
    );

    return {
      found: true,
      id: product.id,
      name: product.name,
      variants,
    };
  } catch (err) {
    return { error: 'Không thể lấy chi tiết sản phẩm', detail: err.message };
  }
};

const getProductReviews = async ({ productId, limit = 5 }) => {
  try {
    const reviews = await db.Comment.findAll({
      where: { productId, star: { [Op.gt]: 0 } },
      attributes: ['id', 'content', 'star', 'createdAt'],
      // ❌ KHÔNG lấy userId để bảo vệ privacy
      order: [['createdAt', 'DESC']],
      limit,
      raw: true,
    });

    const stats = await db.Comment.findOne({
      where: { productId, star: { [Op.gt]: 0 } },
      attributes: [
        [db.sequelize.fn('AVG', db.sequelize.col('star')), 'avg'],
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'total'],
      ],
      raw: true,
    });

    return {
      productId,
      avgStar: stats?.avg ? parseFloat(Number(stats.avg).toFixed(1)) : 0,
      totalReviews: Number(stats?.total) || 0,
      reviews: reviews.map((r) => ({
        star: r.star,
        content: r.content,
        date: r.createdAt,
      })),
    };
  } catch (err) {
    return { error: 'Không thể lấy review', detail: err.message };
  }
};

const getCategories = async () => {
  try {
    const [categories, brands, sizes] = await Promise.all([
      db.Allcode.findAll({
        where: { type: 'CATEGORY' },
        attributes: ['code', 'value'],
        raw: true,
      }),
      db.Allcode.findAll({
        where: { type: 'BRAND' },
        attributes: ['code', 'value'],
        raw: true,
      }),
      db.Allcode.findAll({
        where: { type: 'SIZE' },
        attributes: ['code', 'value'],
        raw: true,
      }),
    ]);

    return {
      categories: categories.map((c) => ({ code: c.code, name: c.value })),
      brands: brands.map((b) => ({ code: b.code, name: b.value })),
      sizes: sizes.map((s) => ({ code: s.code, name: s.value })),
    };
  } catch (err) {
    return { error: 'Không thể lấy danh mục', detail: err.message };
  }
};

// ── ORDERS (chỉ của userId đang chat) ────────────────────────
const getMyOrders = async (userId, { limit = 5, statusCode } = {}) => {
  try {
    const addresses = await db.AddressUser.findAll({
      where: { userId },
      attributes: ['id'],
      raw: true,
    });
    if (!addresses.length) return { orders: [], message: 'Bạn chưa có địa chỉ giao hàng' };

    const addressIds = addresses.map((a) => a.id);
    const where = { addressUserId: { [Op.in]: addressIds } };
    if (statusCode) where.statusId = statusCode;

    const orders = await db.OrderProduct.findAll({
      where,
      include: [
        { model: db.Allcode, as: 'statusOrderData', attributes: ['value'] },
        {
          model: db.TypeShip,
          as: 'typeShipData',
          attributes: ['type', 'price'],
        },
        {
          model: db.OrderDetail,
          as: 'orderDetail',
          attributes: ['quantity', 'realPrice'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      raw: false,
    });

    return {
      total: orders.length,
      orders: orders.map((o) => {
        const totalPrice =
          o.orderDetail?.reduce((sum, d) => sum + Number(d.realPrice) * d.quantity, 0) || 0;
        return {
          id: o.id,
          status: o.statusOrderData?.value || o.statusId,
          statusCode: o.statusId,
          totalItems: o.orderDetail?.reduce((sum, d) => sum + d.quantity, 0) || 0,
          totalPrice,
          shipType: o.typeShipData?.type,
          shipPrice: Number(o.typeShipData?.price) || 0,
          note: o.note,
          isPaymentOnline: o.isPaymentOnlien === 1,
          createdAt: o.createdAt,
        };
      }),
    };
  } catch (err) {
    return { error: 'Không thể lấy đơn hàng', detail: err.message };
  }
};

const getOrderDetail = async (userId, { orderId }) => {
  try {
    // Lấy addressIds của user để xác minh quyền sở hữu đơn hàng
    const addresses = await db.AddressUser.findAll({
      where: { userId },
      attributes: ['id'],
      raw: true,
    });
    const addressIds = addresses.map((a) => a.id);

    const order = await db.OrderProduct.findOne({
      where: {
        id: orderId,
        addressUserId: { [Op.in]: addressIds }, // ← bảo đảm chỉ xem đơn của mình
      },
      include: [
        { model: db.Allcode, as: 'statusOrderData', attributes: ['value'] },
        {
          model: db.TypeShip,
          as: 'typeShipData',
          attributes: ['type', 'price'],
        },
        {
          model: db.OrderDetail,
          as: 'orderDetail',
          attributes: ['id', 'quantity', 'realPrice', 'productId'],
        },
      ],
      raw: false,
    });

    if (!order)
      return {
        found: false,
        message: 'Không tìm thấy đơn hàng hoặc không có quyền xem',
      };

    // Lấy tên sản phẩm từ ProductDetailSize
    const detailsWithName = await Promise.all(
      (order.orderDetail || []).map(async (d) => {
        const pds = await db.ProductDetailSize.findOne({
          where: { id: d.productId },
          include: [
            {
              model: db.ProductDetail,
              as: 'productDetailData',
              attributes: ['nameDetail'],
              include: [
                {
                  model: db.Product,
                  as: 'productDetailData',
                  attributes: ['name'],
                },
              ],
            },
          ],
          raw: false,
        }).catch(() => null);

        return {
          quantity: d.quantity,
          price: Number(d.realPrice),
          total: Number(d.realPrice) * d.quantity,
          productName: pds?.productDetailData?.productDetailData?.name || `SP#${d.productId}`,
          variant: pds?.productDetailData?.nameDetail || '',
        };
      })
    );

    return {
      found: true,
      id: order.id,
      status: order.statusOrderData?.value,
      statusCode: order.statusId,
      note: order.note,
      shipType: order.typeShipData?.type,
      shipPrice: Number(order.typeShipData?.price) || 0,
      isPaymentOnline: order.isPaymentOnlien === 1,
      createdAt: order.createdAt,
      items: detailsWithName,
      totalPrice: detailsWithName.reduce((s, d) => s + d.total, 0),
    };
  } catch (err) {
    return { error: 'Không thể lấy chi tiết đơn', detail: err.message };
  }
};

// ── CART (chỉ của userId đang chat) ──────────────────────────
const getMyCart = async (userId) => {
  try {
    const cartItems = await db.ShopCart.findAll({
      where: { userId, statusId: 0 },
      include: [
        {
          model: db.ProductDetailSize,
          as: 'productDetailSizeData',
          attributes: ['id', 'sizeId'],
          include: [
            {
              model: db.ProductDetail,
              as: 'productDetailData',
              attributes: ['nameDetail', 'discountPrice'],
              include: [
                {
                  model: db.Product,
                  as: 'productDetailData',
                  attributes: ['name'],
                },
              ],
            },
            { model: db.Allcode, as: 'sizeData', attributes: ['value'] },
          ],
        },
      ],
      raw: false,
    });

    if (!cartItems.length) return { isEmpty: true, message: 'Giỏ hàng trống' };

    const items = cartItems.map((c) => {
      const detail = c.productDetailSizeData?.productDetailData;
      const price = Number(detail?.discountPrice) || 0;
      return {
        productName: detail?.productDetailData?.name || 'Sản phẩm',
        variant: detail?.nameDetail,
        size: c.productDetailSizeData?.sizeData?.value || c.productDetailSizeData?.sizeId,
        quantity: c.quantity,
        price,
        total: price * c.quantity,
      };
    });

    return {
      isEmpty: false,
      totalItems: items.reduce((s, i) => s + i.quantity, 0),
      totalPrice: items.reduce((s, i) => s + i.total, 0),
      items,
    };
  } catch (err) {
    return { error: 'Không thể lấy giỏ hàng', detail: err.message };
  }
};

// ── VOUCHERS ─────────────────────────────────────────────────
const getAvailableVouchers = async () => {
  try {
    const vouchers = await db.Voucher.findAll({
      include: [
        {
          model: db.TypeVoucher,
          as: 'typeVoucherOfVoucherData',
          attributes: ['value', 'maxValue', 'minValue'],
          include: [{ model: db.Allcode, as: 'typeVoucherData', attributes: ['value'] }],
        },
      ],
      raw: false,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const valid = vouchers.filter((v) => {
      if (!v.toDate) return true;
      const [dd, mm, yyyy] = v.toDate.split('/');
      return new Date(`${yyyy}-${mm}-${dd}`) >= today;
    });

    if (!valid.length) return { vouchers: [], message: 'Hiện không có voucher nào' };

    return {
      total: valid.length,
      vouchers: valid.map((v) => ({
        code: v.codeVoucher,
        amount: v.amount,
        fromDate: v.fromDate,
        toDate: v.toDate,
        discountValue: Number(v.typeVoucherOfVoucherData?.value) || 0,
        maxDiscount: Number(v.typeVoucherOfVoucherData?.maxValue) || 0,
        minOrderValue: Number(v.typeVoucherOfVoucherData?.minValue) || 0,
        type: v.typeVoucherOfVoucherData?.typeVoucherData?.value,
      })),
    };
  } catch (err) {
    return { error: 'Không thể lấy voucher', detail: err.message };
  }
};

// ── SHIPPING ─────────────────────────────────────────────────
const getShippingOptions = async () => {
  try {
    const options = await db.TypeShip.findAll({
      attributes: ['id', 'type', 'price'],
      raw: true,
    });

    return {
      options: options.map((o) => ({
        id: o.id,
        name: o.type,
        price: Number(o.price),
      })),
      note: 'Miễn phí vận chuyển cho đơn từ 500.000đ',
    };
  } catch (err) {
    return { error: 'Không thể lấy thông tin vận chuyển', detail: err.message };
  }
};

// ── BLOG ─────────────────────────────────────────────────────
const getBlogs = async ({ keyword = '', limit = 3 }) => {
  try {
    const where = { statusId: 'S1' };
    if (keyword) where.title = { [Op.like]: `%${keyword}%` };

    const blogs = await db.Blog.findAll({
      where,
      attributes: ['id', 'title', 'shortdescription', 'createdAt'],
      // ❌ KHÔNG lấy contentHTML, contentMarkdown (quá dài)
      // ❌ KHÔNG lấy userId (privacy)
      include: [{ model: db.Allcode, as: 'subjectData', attributes: ['value'] }],
      order: [['createdAt', 'DESC']],
      limit,
      raw: false,
    });

    return {
      total: blogs.length,
      blogs: blogs.map((b) => ({
        id: b.id,
        title: b.title,
        subject: b.subjectData?.value,
        shortDescription: b.shortdescription,
        date: b.createdAt,
      })),
    };
  } catch (err) {
    return { error: 'Không thể lấy bài viết', detail: err.message };
  }
};

// ── BANNERS / PROMOTIONS ─────────────────────────────────────
const getCurrentPromotions = async () => {
  try {
    const banners = await db.Banner.findAll({
      where: { statusId: 'S1' },
      attributes: ['id', 'name', 'description'],
      // ❌ KHÔNG lấy image (BLOB, rất nặng)
      raw: true,
    });

    return {
      total: banners.length,
      promotions: banners.map((b) => ({
        id: b.id,
        name: b.name,
        description: b.description,
      })),
    };
  } catch (err) {
    return { error: 'Không thể lấy khuyến mãi', detail: err.message };
  }
};

// L2 IMPLEMENTATIONS
// ── L2: CART CHI TIẾT ────────────────────────────────────────
const getCartByUser = async (userId) => {
  try {
    const cartItems = await db.ShopCart.findAll({
      where: { userId, statusId: 0 },
      raw: true,
    });

    if (!cartItems.length) return { isEmpty: true, message: 'Giỏ hàng của bạn đang trống' };

    const enriched = await Promise.all(
      cartItems.map(async (item) => {
        const pds = await db.ProductDetailSize.findOne({
          where: { id: item.productdetailsizeId },
          raw: true,
        });
        if (!pds) return null;

        const detail = await db.ProductDetail.findOne({
          where: { id: pds.productdetailId },
          raw: true,
        });
        if (!detail) return null;

        const product = await db.Product.findOne({
          where: { id: detail.productId },
          raw: true,
        });

        const price = Number(detail.discountPrice) || 0;
        const originalPrice = Number(detail.originalPrice) || 0;

        return {
          productName: product?.name || 'Sản phẩm',
          variant: detail?.nameDetail || '',
          size: pds.sizeId,
          quantity: item.quantity,
          unitPrice: price,
          originalPrice,
          lineTotal: price * item.quantity,
          saving: (originalPrice - price) * item.quantity,
        };
      })
    );

    const validItems = enriched.filter(Boolean);

    const totalPrice = validItems.reduce((s, i) => s + i.lineTotal, 0);
    const totalSaving = validItems.reduce((s, i) => s + i.saving, 0);
    const totalQty = validItems.reduce((s, i) => s + i.quantity, 0);

    return {
      isEmpty: false,
      totalItems: totalQty,
      totalPrice,
      totalSaving,
      freeShipThreshold: 500000,
      needMoreForFreeShip: Math.max(0, 500000 - totalPrice),
      items: validItems,
    };
  } catch (err) {
    return { error: 'Không thể lấy giỏ hàng', detail: err.message };
  }
};

// ── L2: TỒN KHO ──────────────────────────────────────────────
const checkProductStock = async ({ productId }) => {
  try {
    const details = await db.ProductDetail.findAll({
      where: { productId },
      raw: true,
    });

    const variants = await Promise.all(
      details.map(async (d) => {
        const sizes = await db.ProductDetailSize.findAll({
          where: { productdetailId: d.id },
          raw: true,
        });

        return {
          variantId: d.id,
          variantName: d.nameDetail,
          price: Number(d.discountPrice),
          sizes: sizes.map((s) => ({
            sizeId: s.id,
            sizeName: s.sizeId,
            available: true,
          })),
          totalSizes: sizes.length,
        };
      })
    );

    return {
      found: true,
      productId,
      variants,
    };
  } catch (err) {
    return { error: 'Không thể kiểm tra tồn kho', detail: err.message };
  }
};

// ── L2: REVIEW CHI TIẾT ──────────────────────────────────────
const getDetailedReviews = async ({ productId, minStar = 1, limit = 5 }) => {
  try {
    const where = {
      productId,
      star: { [Op.gte]: minStar, [Op.gt]: 0 },
    };

    const [reviews, stats] = await Promise.all([
      db.Comment.findAll({
        where,
        attributes: ['id', 'content', 'star', 'createdAt'],
        // ❌ Không lấy userId — bảo vệ privacy
        order: [['createdAt', 'DESC']],
        limit,
        raw: true,
      }),
      db.Comment.findOne({
        where: { productId, star: { [Op.gt]: 0 } },
        attributes: [
          [db.sequelize.fn('AVG', db.sequelize.col('star')), 'avg'],
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'total'],
          [db.sequelize.fn('MAX', db.sequelize.col('star')), 'maxStar'],
          [db.sequelize.fn('MIN', db.sequelize.col('star')), 'minStar'],
        ],
        raw: true,
      }),
    ]);

    // Phân bố sao (1★ → 5★)
    const starCounts = await db.Comment.findAll({
      where: { productId, star: { [Op.gt]: 0 } },
      attributes: ['star', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
      group: ['star'],
      raw: true,
    });

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    starCounts.forEach((s) => {
      distribution[s.star] = Number(s.count);
    });

    return {
      productId,
      avgStar: stats?.avg ? parseFloat(Number(stats.avg).toFixed(1)) : 0,
      totalReviews: Number(stats?.total) || 0,
      distribution,
      sentiment:
        Number(stats?.avg) >= 4
          ? 'Rất tốt ⭐⭐⭐⭐⭐'
          : Number(stats?.avg) >= 3
            ? 'Tốt ⭐⭐⭐⭐'
            : Number(stats?.avg) >= 2
              ? 'Trung bình ⭐⭐⭐'
              : 'Cần cải thiện',
      reviews: reviews.map((r) => ({
        star: r.star,
        content: r.content || '(Không có nội dung)',
        date: r.createdAt,
      })),
    };
  } catch (err) {
    return { error: 'Không thể lấy review', detail: err.message };
  }
};

// ── L2: THÔNG TIN CÁ NHÂN USER ───────────────────────────────
const getUserProfile = async (userId) => {
  try {
    const user = await db.User.findOne({
      where: { id: userId },
      // ❌ TUYỆT ĐỐI không lấy: password, usertoken, image(BLOB)
      // ⚠️  email và phonenumber chỉ trả về của chính user (không lộ ra bên ngoài)
      attributes: [
        'id',
        'firstName',
        'lastName',
        'email',
        'phonenumber',
        'address',
        'dob',
        'isActiveEmail',
      ],
      raw: true,
    });
    if (!user) return { found: false, message: 'Không tìm thấy tài khoản' };

    // Lấy địa chỉ giao hàng đã lưu
    const addresses = await db.AddressUser.findAll({
      where: { userId },
      attributes: ['id', 'shipName', 'shipAdress', 'shipEmail', 'shipPhonenumber'],
      // ❌ Không lấy lat/lng (tọa độ nhạy cảm)
      raw: true,
    });

    return {
      found: true,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      email: user.email,
      phone: user.phonenumber,
      address: user.address,
      dob: user.dob,
      emailVerified: user.isActiveEmail,
      savedAddresses: addresses.map((a) => ({
        id: a.id,
        recipientName: a.shipName,
        address: a.shipAdress,
        phone: a.shipPhonenumber,
        email: a.shipEmail,
      })),
      totalAddresses: addresses.length,
    };
  } catch (err) {
    return { error: 'Không thể lấy thông tin tài khoản', detail: err.message };
  }
};

// ── L2: CHI TIẾT ĐƠN HÀNG ĐẦY ĐỦ ────────────────────────────
const getFullOrderDetail = async (userId, { orderId }) => {
  try {
    const addresses = await db.AddressUser.findAll({
      where: { userId },
      attributes: ['id', 'shipName', 'shipAdress', 'shipPhonenumber'],
      raw: true,
    });

    const addressMap = Object.fromEntries(addresses.map((a) => [a.id, a]));
    const addressIds = addresses.map((a) => a.id);

    const order = await db.OrderProduct.findOne({
      where: { id: orderId, addressUserId: { [Op.in]: addressIds } },
      include: [
        { model: db.Allcode, as: 'statusOrderData', attributes: ['value'] },
        { model: db.TypeShip, as: 'typeShipData', attributes: ['type', 'price'] },
        {
          model: db.OrderDetail,
          as: 'orderDetail',
          attributes: ['quantity', 'realPrice', 'productId'],
        },
      ],
      raw: false,
    });

    if (!order) return { found: false, message: 'Không tìm thấy đơn hàng' };

    const items = await Promise.all(
      (order.orderDetail || []).map(async (d) => {
        const pds = await db.ProductDetailSize.findOne({ where: { id: d.productId }, raw: true });
        if (!pds) return null;

        const detail = await db.ProductDetail.findOne({
          where: { id: pds.productdetailId },
          raw: true,
        });
        if (!detail) return null;

        const product = await db.Product.findOne({ where: { id: detail.productId }, raw: true });

        const lineTotal = Number(d.realPrice) * d.quantity;

        return {
          productName: product?.name || `SP#${d.productId}`,
          variant: detail?.nameDetail || '',
          size: pds.sizeId,
          quantity: d.quantity,
          unitPrice: Number(d.realPrice),
          lineTotal,
        };
      })
    );

    const validItems = items.filter(Boolean);
    const totalPrice = validItems.reduce((s, i) => s + i.lineTotal, 0);
    const shipPrice = Number(order.typeShipData?.price) || 0;

    return {
      found: true,
      id: order.id,
      status: order.statusOrderData?.value,
      shipType: order.typeShipData?.type,
      shipPrice,
      totalProductPrice: totalPrice,
      grandTotal: totalPrice + shipPrice,
      deliveryAddress: addressMap[order.addressUserId],
      items: validItems,
    };
  } catch (err) {
    return { error: 'Không thể lấy chi tiết đơn hàng', detail: err.message };
  }
};

// ── L2: THEO DÕI SHIPPER ─────────────────────────────────────
const trackShipperLocation = async (userId, { orderId }) => {
  try {
    // Bước 1: Xác minh đơn thuộc về user
    const order = await db.OrderProduct.findOne({
      where: { id: orderId },
      attributes: ['id', 'statusId', 'shipperId', 'addressUserId'],
      raw: true,
    });
    if (!order) return { found: false, message: 'Không tìm thấy đơn hàng' };

    const address = await db.AddressUser.findOne({
      where: { id: order.addressUserId, userId },
      raw: true,
    });
    if (!address) return { authorized: false, message: 'Bạn không có quyền xem đơn này' };

    // Bước 2: Kiểm tra trạng thái đơn
    const statusMessages = {
      S3: {
        label: 'Chờ xác nhận',
        hasShipper: false,
        message: 'Đơn đang chờ shop xác nhận, chưa có shipper nhận đơn.',
      },
      S4: {
        label: 'Đang giao hàng',
        hasShipper: true,
        message: 'Đơn đang được giao đến bạn.',
      },
      S5: {
        label: 'Đã giao thành công',
        hasShipper: false,
        message: 'Đơn đã được giao thành công.',
      },
      S6: {
        label: 'Đã huỷ',
        hasShipper: false,
        message: 'Đơn hàng đã bị huỷ.',
      },
      S7: {
        label: 'Trả hàng',
        hasShipper: false,
        message: 'Đơn đang trong trạng thái hoàn hàng.',
      },
    };

    const statusInfo = statusMessages[order.statusId] || {
      label: order.statusId,
      hasShipper: false,
    };

    if (!order.shipperId || !statusInfo.hasShipper) {
      return {
        found: true,
        orderId,
        status: statusInfo.label,
        hasShipper: false,
        message: statusInfo.message,
        shipperLocation: null,
      };
    }

    // Bước 3: Lấy vị trí shipper (chỉ trả về có/không, không lộ tọa độ chính xác)
    const location = await db.ShipperLocation.findOne({
      where: { shipperId: order.shipperId },
      attributes: ['lat', 'lng'],
      raw: true,
    });

    return {
      found: true,
      orderId,
      status: statusInfo.label,
      hasShipper: true,
      message: statusInfo.message,
      shipperOnline: !!location,
      // ⚠️ Chỉ trả về "có vị trí" hay không — tọa độ chính xác chỉ dùng trên Map UI
      shipperLocation: location
        ? {
            available: true,
            note: 'Shipper đang online, vị trí hiển thị trên bản đồ',
          }
        : { available: false, note: 'Shipper chưa cập nhật vị trí' },
    };
  } catch (err) {
    return { error: 'Không thể lấy thông tin giao hàng', detail: err.message };
  }
};

// ============================================================
// ROUTER — map function name → implementation
// ============================================================
const executeFunctionCall = async (functionName, args, userId) => {
  switch (functionName) {
    // Products
    case 'searchProducts':
      return await searchProducts(args);
    case 'getProductDetail':
      return await getProductDetail(args);
    case 'getProductReviews':
      return await getProductReviews(args);
    case 'getCategories':
      return await getCategories();
    // Orders — truyền userId để enforce ownership
    case 'getMyOrders':
      return await getMyOrders(userId, args);
    case 'getOrderDetail':
      return await getOrderDetail(userId, args);
    // Cart
    case 'getMyCart':
      return await getMyCart(userId);
    // Voucher
    case 'getAvailableVouchers':
      return await getAvailableVouchers();
    // Shipping
    case 'getShippingOptions':
      return await getShippingOptions();
    // Blog
    case 'getBlogs':
      return await getBlogs(args);
    // Promotions
    case 'getCurrentPromotions':
      return await getCurrentPromotions();
    // ── L2 ───────────────────────────────────────────────────
    case 'getCartByUser':
      return await getCartByUser(userId);
    case 'checkProductStock':
      return await checkProductStock(args);
    case 'getDetailedReviews':
      return await getDetailedReviews(args);
    case 'getUserProfile':
      return await getUserProfile(userId);
    case 'getFullOrderDetail':
      return await getFullOrderDetail(userId, args);
    case 'trackShipperLocation':
      return await trackShipperLocation(userId, args);
    default:
      return { error: `Function "${functionName}" không tồn tại` };
  }
};

// ============================================================
// SYSTEM PROMPT
// ============================================================
const buildSystemPrompt = () => `Bạn là trợ lý AI của shop thời trang. Bạn có thể:
- Tư vấn & gợi ý sản phẩm phù hợp nhu cầu, ngân sách, size
- Kiểm tra tồn kho size/màu sản phẩm cụ thể
- Xem và phân tích đánh giá sản phẩm từ khách hàng
- Tra cứu đơn hàng, chi tiết từng đơn, theo dõi giao hàng
- Xem giỏ hàng, tính toán tổng tiền, gợi ý voucher phù hợp
- Cung cấp thông tin tài khoản, địa chỉ giao hàng của user
- Tư vấn phí ship, chính sách đổi trả, voucher giảm giá
- Giới thiệu bài viết thời trang, khuyến mãi đang chạy

Quy tắc trả lời:
- Ngôn ngữ: tiếng Việt, thân thiện, ngắn gọn súc tích
- Luôn gọi function để lấy dữ liệu thực — không bịa đặt giá, tên sản phẩm, tồn kho
- Định dạng giá: 250.000đ (dấu chấm phân cách nghìn)
- Khi gợi ý sản phẩm: nêu tên, giá sale, tiết kiệm bao nhiêu so với giá gốc
- Khi trả lời về đơn: ID + trạng thái + tổng tiền + từng sản phẩm
- Khi trả lời về giỏ hàng: liệt kê từng món + gợi ý voucher nếu phù hợp
- Khi user hỏi shipper: chỉ nói có/không đang giao — không lộ tọa độ chính xác
- Không tiết lộ thông tin cá nhân của người khác (email, SĐT người dùng khác)
- Nếu không có dữ liệu: nói thật, gợi ý liên hệ admin qua chat

Chính sách shop:
- Đổi trả: 7 ngày kể từ ngày nhận hàng, hàng còn nguyên tag
- Free ship: đơn từ 500.000đ
- Thanh toán: COD, PayPal, VNPay
- CSKH: chat trực tiếp với admin qua mục Tin nhắn`;

// ============================================================
// MAIN STREAMING FUNCTION
// ============================================================
const chatWithGemini = async (userId, messages, res) => {
  try {
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      systemInstruction: buildSystemPrompt(),
      tools: [{ functionDeclarations }],
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });

    // Build Gemini history (bỏ message cuối, đó là message hiện tại)
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    const lastMessage = messages[messages.length - 1].content;
    const chat = model.startChat({ history });

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    const sendSSE = (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      res.flush?.();
    };

    // Agentic loop: Gemini → function call → result → Gemini → ...
    let currentMessage = lastMessage;
    const MAX_ITER = 5; // tăng lên 5 vì có thể cần nhiều function calls hơn

    for (let iter = 0; iter < MAX_ITER; iter++) {
      const result = await chat.sendMessage(currentMessage);
      const response = result.response;
      const parts = response.candidates?.[0]?.content?.parts || [];

      const textParts = parts.filter((p) => p.text);
      const fnCalls = parts.filter((p) => p.functionCall);

      // Stream text ngay nếu có
      for (const part of textParts) {
        sendSSE({ type: 'chunk', text: part.text });
      }

      // Không có function call → xong
      if (!fnCalls.length) {
        sendSSE({ type: 'done' });
        break;
      }

      // Có function call → thực thi song song
      const functionResults = await Promise.all(
        fnCalls.map(async (fc) => {
          sendSSE({ type: 'tool_call', name: fc.functionCall.name });
          const data = await executeFunctionCall(
            fc.functionCall.name,
            fc.functionCall.args || {},
            userId
          );
          return {
            functionResponse: { name: fc.functionCall.name, response: data },
          };
        })
      );

      currentMessage = functionResults;

      // Lần lặp cuối — force end
      if (iter === MAX_ITER - 1) {
        const finalResult = await chat.sendMessage(functionResults);
        sendSSE({ type: 'chunk', text: finalResult.response.text() });
        sendSSE({ type: 'done' });
        break;
      }
    }

    res.end();
  } catch (err) {
    console.error('[chatbotService] Error:', err.message);

    // Phân loại lỗi để hiển thị message phù hợp
    let userMessage = 'Đã xảy ra lỗi, vui lòng thử lại.';
    if (err.message?.includes('429') || err.message?.includes('quota')) {
      userMessage = 'Trợ lý đang bận, vui lòng thử lại sau vài giây ⏳';
    } else if (err.message?.includes('403') || err.message?.includes('API_KEY')) {
      userMessage = 'Lỗi cấu hình, vui lòng liên hệ admin.';
    }

    if (!res.headersSent) {
      res.status(500).json({ errCode: -1, errMessage: userMessage });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', text: userMessage })}\n\n`);
      res.end();
    }
  }
};

export default { chatWithGemini };

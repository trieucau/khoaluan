import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import db from '../models/index';
import { Op } from 'sequelize';
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ============================================================
// FUNCTION DECLARATIONS — Gemini sẽ tự gọi khi cần
// ============================================================
const functionDeclarations = [
  {
    name: 'getOrdersByUser',
    description:
      'Lấy danh sách đơn hàng gần đây của user đang chat. Dùng khi user hỏi về đơn hàng, trạng thái giao hàng.',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Số lượng đơn cần lấy, mặc định 5',
        },
      },
      required: [],
    },
  },
  {
    name: 'searchProducts',
    description:
      'Tìm kiếm sản phẩm theo tên, danh mục hoặc thương hiệu. Dùng khi user hỏi về sản phẩm, giá cả, gợi ý mua hàng.',
    parameters: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: 'Từ khoá tìm kiếm tên sản phẩm',
        },
        categoryCode: {
          type: 'string',
          description: 'Mã danh mục sản phẩm (nếu có)',
        },
        limit: {
          type: 'number',
          description: 'Số sản phẩm trả về, mặc định 5',
        },
      },
      required: [],
    },
  },
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
];

// ============================================================
// FUNCTION IMPLEMENTATIONS — Thực thi khi Gemini yêu cầu
// ============================================================
const executeFunctionCall = async (functionName, args, userId) => {
  switch (functionName) {
    case 'getOrdersByUser':
      return await getOrdersByUser(userId, args.limit || 5);
    case 'searchProducts':
      return await searchProducts(args.keyword || '', args.categoryCode, args.limit || 5);
    case 'getAvailableVouchers':
      return await getAvailableVouchers();
    default:
      return { error: 'Function không tồn tại' };
  }
};

const getOrdersByUser = async (userId, limit) => {
  try {
    // Lấy addressUserId của user
    const addresses = await db.AddressUser.findAll({
      where: { userId },
      attributes: ['id'],
      raw: true,
    });
    if (!addresses.length) return { orders: [], message: 'User chưa có địa chỉ' };

    const addressIds = addresses.map((a) => a.id);

    const orders = await db.OrderProduct.findAll({
      where: { addressUserId: { [Op.in]: addressIds } },
      include: [
        {
          model: db.Allcode,
          as: 'statusOrderData',
          attributes: ['value'],
        },
        {
          model: db.OrderDetail,
          as: 'orderDetail',
          attributes: ['quantity', 'realPrice'],
          limit: 3,
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      raw: false,
    });

    return {
      orders: orders.map((o) => ({
        id: o.id,
        status: o.statusOrderData?.value || o.statusId,
        totalItems: o.orderDetail?.length || 0,
        totalPrice:
          o.orderDetail?.reduce((sum, d) => sum + Number(d.realPrice) * d.quantity, 0) || 0,
        note: o.note,
        createdAt: o.createdAt,
        isPaymentOnline: o.isPaymentOnlien === 1,
      })),
    };
  } catch (err) {
    return { error: 'Không thể lấy đơn hàng', detail: err.message };
  }
};

const searchProducts = async (keyword, categoryCode, limit) => {
  try {
    const whereClause = { statusId: 'S1' };
    if (categoryCode) whereClause.categoryId = categoryCode;

    const products = await db.Product.findAll({
      where: {
        ...whereClause,
        ...(keyword ? { name: { [Op.like]: `%${keyword}%` } } : {}),
      },
      include: [
        {
          model: db.ProductDetail,
          as: 'productDetailData',
          attributes: ['nameDetail', 'originalPrice', 'discountPrice', 'description'],
          limit: 2,
        },
        {
          model: db.Allcode,
          as: 'categoryData',
          attributes: ['value'],
        },
        {
          model: db.Allcode,
          as: 'brandData',
          attributes: ['value'],
        },
      ],
      limit,
      raw: false,
    });

    return {
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.categoryData?.value,
        brand: p.brandData?.value,
        material: p.material,
        madeby: p.madeby,
        variants: p.productDetailData?.map((d) => ({
          name: d.nameDetail,
          originalPrice: d.originalPrice,
          discountPrice: d.discountPrice,
        })),
      })),
    };
  } catch (err) {
    return { error: 'Không thể tìm sản phẩm', detail: err.message };
  }
};

const getAvailableVouchers = async () => {
  try {
    const today = new Date().toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const vouchers = await db.Voucher.findAll({
      include: [
        {
          model: db.TypeVoucher,
          as: 'typeVoucherOfVoucherData',
          attributes: ['minPrice', 'discountPrice', 'maxDiscountPrice'],
          include: [
            {
              model: db.Allcode,
              as: 'typeVoucherData',
              attributes: ['value'],
            },
          ],
        },
      ],
      raw: false,
    });

    // Lọc còn hạn (format DD/MM/YYYY)
    const validVouchers = vouchers.filter((v) => {
      if (!v.toDate) return true;
      const [dd, mm, yyyy] = v.toDate.split('/');
      const expiry = new Date(`${yyyy}-${mm}-${dd}`);
      return expiry >= new Date();
    });

    return {
      vouchers: validVouchers.map((v) => ({
        code: v.codeVoucher,
        amount: v.amount,
        toDate: v.toDate,
        type: v.typeVoucherOfVoucherData?.typeVoucherData?.value,
        minPrice: v.typeVoucherOfVoucherData?.minPrice,
        discountPrice: v.typeVoucherOfVoucherData?.discountPrice,
      })),
    };
  } catch (err) {
    return { error: 'Không thể lấy voucher', detail: err.message };
  }
};

// ============================================================
// SYSTEM PROMPT
// ============================================================
const buildSystemPrompt = () => {
  return `Bạn là trợ lý AI của shop thời trang. Nhiệm vụ:
1. Tư vấn sản phẩm, gợi ý mua hàng phù hợp nhu cầu
2. Tra cứu và cung cấp thông tin đơn hàng của khách
3. Giải đáp chính sách, khuyến mãi, voucher

Quy tắc:
- Trả lời bằng tiếng Việt, thân thiện, ngắn gọn
- Khi cần thông tin từ hệ thống, hãy gọi function tương ứng
- Định dạng giá tiền: dùng dấu chấm phân cách nghìn (VD: 250.000đ)
- Với đơn hàng: hiển thị ID ngắn gọn và trạng thái rõ ràng
- Không bịa đặt thông tin, chỉ dựa vào dữ liệu thực từ hệ thống
- Nếu không tìm thấy thông tin, hãy nói thật và gợi ý liên hệ admin

Chính sách shop:
- Đổi trả trong 7 ngày kể từ ngày nhận hàng
- Miễn phí vận chuyển cho đơn từ 500.000đ
- Hỗ trợ thanh toán: COD, PayPal, VNPay`;
};

// ============================================================
// MAIN STREAMING FUNCTION
// ============================================================
const chatWithGemini = async (userId, messages, res) => {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
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

    // Chuyển đổi messages sang Gemini format
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1].content;

    const chat = model.startChat({ history });

    // Gửi headers cho SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    const sendSSE = (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Vòng lặp xử lý function calling
    let currentMessage = lastMessage;
    let iterCount = 0;
    const MAX_ITER = 3;

    while (iterCount < MAX_ITER) {
      iterCount++;
      const result = await chat.sendMessage(currentMessage);
      const response = result.response;
      const candidates = response.candidates;

      if (!candidates || !candidates.length) {
        sendSSE({ type: 'error', text: 'Không nhận được phản hồi từ AI' });
        break;
      }

      const parts = candidates[0].content?.parts || [];
      let hasText = false;
      let functionCalls = [];

      for (const part of parts) {
        if (part.text) {
          hasText = true;
          // Gửi từng đoạn text
          sendSSE({ type: 'chunk', text: part.text });
        }
        if (part.functionCall) {
          functionCalls.push(part.functionCall);
        }
      }

      // Nếu không có function call → done
      if (!functionCalls.length) {
        sendSSE({ type: 'done' });
        break;
      }

      // Thực thi tất cả function calls
      const functionResults = await Promise.all(
        functionCalls.map(async (fc) => {
          sendSSE({ type: 'tool_call', name: fc.name }); // thông báo đang query DB
          const result = await executeFunctionCall(fc.name, fc.args || {}, userId);
          return {
            functionResponse: {
              name: fc.name,
              response: result,
            },
          };
        })
      );

      // Gửi kết quả function về lại Gemini
      currentMessage = functionResults;

      // Nếu là lần cuối, stream kết quả
      if (iterCount === MAX_ITER) {
        const finalResult = await chat.sendMessage(functionResults);
        const finalText = finalResult.response.text();
        sendSSE({ type: 'chunk', text: finalText });
        sendSSE({ type: 'done' });
        break;
      }
    }

    res.end();
  } catch (err) {
    console.error('[chatbotService] Error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ errCode: -1, errMessage: 'Lỗi chatbot service' });
    } else {
      res.write(
        `data: ${JSON.stringify({ type: 'error', text: 'Đã xảy ra lỗi, vui lòng thử lại.' })}\n\n`
      );
      res.end();
    }
  }
};

export default { chatWithGemini };

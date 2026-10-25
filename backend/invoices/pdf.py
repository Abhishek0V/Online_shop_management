from decimal import Decimal
from io import BytesIO
from xml.sax.saxutils import escape

from django.conf import settings
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

STYLES = getSampleStyleSheet()
SMALL = ParagraphStyle("small", parent=STYLES["Normal"], fontSize=9, leading=12)
TITLE = ParagraphStyle("title", parent=STYLES["Title"], fontSize=20, alignment=0, spaceAfter=2)
RIGHT = ParagraphStyle("right", parent=SMALL, alignment=2)
DARK = colors.HexColor("#0b5cad")


def money(value) -> str:
    # The built-in PDF fonts have no rupee glyph, so "Rs." is used.
    return f"Rs. {Decimal(value):,.2f}"


def _p(text, style=SMALL):
    return Paragraph(escape(str(text)), style)


def build_invoice_pdf(invoice) -> bytes:
    order = invoice.order
    payment = order.payments.filter(status="captured").first()
    issued = timezone.localtime(invoice.issued_at).strftime("%d %b %Y")

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=16 * mm, bottomMargin=16 * mm,
        title=f"Invoice {invoice.invoice_number}", author=settings.SHOP_NAME,
    )
    story = [Paragraph("TAX INVOICE", TITLE), _p(settings.SHOP_NAME, STYLES["Heading3"])]
    if settings.SHOP_ADDRESS:
        story.append(_p(settings.SHOP_ADDRESS))
    if settings.SHOP_GSTIN:
        story.append(_p(f"GSTIN: {settings.SHOP_GSTIN}"))
    story.append(Spacer(1, 8 * mm))

    meta = Table(
        [
            [_p(f"Invoice no: {invoice.invoice_number}"), _p(f"Order no: {order.order_number}", RIGHT)],
            [_p(f"Invoice date: {issued}"), _p(f"Payment ID: {payment.razorpay_payment_id if payment else '-'}", RIGHT)],
        ],
        colWidths=[87 * mm, 87 * mm],
    )
    story += [meta, Spacer(1, 6 * mm), _p("Bill to / Ship to", STYLES["Heading4"])]
    story += [
        _p(order.ship_name),
        _p(order.ship_address_line),
        _p(f"{order.ship_city}, {order.ship_state} - {order.ship_pincode}"),
        _p(f"Phone: {order.ship_phone}"),
        _p(f"Email: {order.user.email}"),
        Spacer(1, 8 * mm),
    ]

    rows = [["#", "Item", "Code", "Qty", "Unit price", "Amount"]]
    for index, item in enumerate(order.items.all(), start=1):
        label = item.item_name + (" (spare part)" if item.item_type == "spare_part" else "")
        rows.append([str(index), _p(label), _p(item.item_code or "-"), str(item.quantity), money(item.unit_price), money(item.line_total)])
    items = Table(rows, colWidths=[8 * mm, 66 * mm, 28 * mm, 12 * mm, 28 * mm, 32 * mm], repeatRows=1)
    items.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DARK), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 9), ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#9ca3af")),
        ("ALIGN", (3, 0), (-1, -1), "RIGHT"), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f3f5f8")]),
    ]))
    story += [items, Spacer(1, 6 * mm)]

    totals = Table(
        [
            ["Subtotal", money(order.subtotal)],
            [f"GST ({order.gst_percent.normalize():f}%)", money(order.tax_amount)],
            ["Total paid", money(order.total_amount)],
        ],
        colWidths=[40 * mm, 36 * mm], hAlign="RIGHT",
    )
    totals.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 10), ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"), ("LINEABOVE", (0, -1), (-1, -1), 0.8, colors.black),
    ]))
    story += [totals, Spacer(1, 12 * mm), _p("This is a computer-generated invoice and does not need a signature.")]

    doc.build(story)
    return buffer.getvalue()
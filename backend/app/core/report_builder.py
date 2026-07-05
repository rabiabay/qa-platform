# app/core/report_builder.py
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, PageBreak
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from datetime import datetime
import io
import os

def register_fonts():
    font_paths = ["C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/Arial.ttf"]
    bold_paths = ["C:/Windows/Fonts/arialbd.ttf", "C:/Windows/Fonts/ArialBD.ttf"]
    try:
        for path in font_paths:
            if os.path.exists(path):
                pdfmetrics.registerFont(TTFont('Arial', path))
                break
        for path in bold_paths:
            if os.path.exists(path):
                pdfmetrics.registerFont(TTFont('Arial-Bold', path))
                break
        return True
    except:
        return False

def temizle_hata(ozet: str) -> str:
    if not ozet:
        return 'Bilinmeyen hata'
    if 'GetHandleVerifier' in ozet or 'chromedriver' in ozet:
        return 'Element bulunamadi veya sayfa yuklenemedi'
    if 'invalid selector' in ozet:
        return 'Gecersiz element secici kullanildi'
    if 'timeout' in ozet.lower():
        return 'Zaman asimi - element bulunamadi'
    if 'no such element' in ozet:
        return 'Element sayfada mevcut degil'
    if 'stale' in ozet:
        return 'Element artik sayfada yok'
    if 'click' in ozet.lower():
        return 'Element tiklanamadi'
    return ozet[:80]

def build_pdf_report(projeler_data: list) -> bytes:
    has_arial = register_fonts()
    NF = 'Arial' if has_arial else 'Helvetica'
    BF = 'Arial-Bold' if has_arial else 'Helvetica-Bold'

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm
    )

    PRIMARY = colors.HexColor('#1A1A1A')
    ACCENT = colors.HexColor('#4F46E5')
    GREEN = colors.HexColor('#0F6E56')
    RED = colors.HexColor('#A32D2D')
    LIGHT_GRAY = colors.HexColor('#F4F3F0')
    BORDER = colors.HexColor('#EDEBE5')

    def stil(isim, font=None, size=10, color=None, before=0, after=4):
        return ParagraphStyle(
            isim,
            fontName=font or NF,
            fontSize=size,
            textColor=color or PRIMARY,
            spaceBefore=before,
            spaceAfter=after,
        )

    story = []

    # İstatistik hesapla
    toplam_kosum = 0
    toplam_basarili = 0
    toplam_basarisiz = 0
    tum_basarisiz = []

    for proje in projeler_data:
        for senaryo in proje.get('senaryolar', []):
            for k in senaryo.get('kosumlar', []):
                toplam_kosum += 1
                if k.get('durum') == 'basarili':
                    toplam_basarili += 1
                else:
                    toplam_basarisiz += 1
                    try:
                        tarih = datetime.fromisoformat(str(k['baslangic_zamani'])).strftime('%d.%m.%Y %H:%M')
                    except:
                        tarih = '-'
                    tum_basarisiz.append({
                        'proje': proje['ad'],
                        'senaryo': senaryo['ad'],
                        'sure': f"{(k.get('sure_ms', 0) / 1000):.1f}s" if k.get('sure_ms') else '-',
                        'tarih': tarih,
                        'receteler': senaryo.get('receteler', [])
                    })

    basari_orani = round(toplam_basarili / toplam_kosum * 100) if toplam_kosum > 0 else 0

    # ── BAŞLIK ──────────────────────────────────────────────
    story.append(Paragraph("QARA Test Raporu", ParagraphStyle(
        'Ana', fontName=BF, fontSize=20, textColor=PRIMARY, spaceAfter=4
    )))
    story.append(Paragraph(
        f"Olusturma Tarihi: {datetime.now().strftime('%d.%m.%Y %H:%M')}",
        stil('Tarih', size=9, color=colors.HexColor('#888888'), after=2)
    ))
    proje_adlari = [p['ad'] for p in projeler_data if p.get('senaryolar')]
    if proje_adlari:
        story.append(Paragraph(
            f"Kapsam: {', '.join(proje_adlari)}",
            stil('Kapsam', size=9, color=colors.HexColor('#888888'), after=10)
        ))
    story.append(HRFlowable(width="100%", thickness=2, color=ACCENT))
    story.append(Spacer(1, 0.4*cm))

    # ── GENEL OZET TABLO ────────────────────────────────────
    story.append(Paragraph("Genel Ozet", ParagraphStyle(
        'BolumBaslik', fontName=BF, fontSize=14, textColor=PRIMARY, spaceAfter=8
    )))

    ozet_data = [
        ['Toplam Test', 'Basarili', 'Basarisiz', 'Basari Orani'],
        [str(toplam_kosum), str(toplam_basarili), str(toplam_basarisiz), f'%{basari_orani}']
    ]
    ozet_tablo = Table(ozet_data, colWidths=[4*cm, 4*cm, 4*cm, 4*cm])
    ozet_tablo.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), BF),
        ('FONTNAME', (0,1), (-1,1), BF),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('FONTSIZE', (0,1), (-1,1), 16),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 10),
        ('GRID', (0,0), (-1,-1), 0.3, BORDER),
        ('TEXTCOLOR', (1,1), (1,1), GREEN),
        ('TEXTCOLOR', (2,1), (2,1), RED),
        ('TEXTCOLOR', (3,1), (3,1), ACCENT),
    ]))
    story.append(ozet_tablo)
    story.append(Spacer(1, 0.5*cm))

    # ── PROJE BAZINDA OZET ──────────────────────────────────
    story.append(Paragraph("Proje Bazinda Ozet", ParagraphStyle(
        'BolumBaslik', fontName=BF, fontSize=14, textColor=PRIMARY, spaceAfter=8
    )))

    proje_tablo_data = [['Proje Adi', 'Senaryo', 'Kosum', 'Basarili', 'Basarisiz', 'Basari %']]
    for proje in projeler_data:
        p_kosum = p_basarili = p_basarisiz = 0
        p_senaryo = len(proje.get('senaryolar', []))
        for senaryo in proje.get('senaryolar', []):
            for k in senaryo.get('kosumlar', []):
                p_kosum += 1
                if k.get('durum') == 'basarili':
                    p_basarili += 1
                else:
                    p_basarisiz += 1
        p_oran = round(p_basarili / p_kosum * 100) if p_kosum > 0 else 0
        proje_tablo_data.append([
            proje['ad'], str(p_senaryo), str(p_kosum),
            str(p_basarili), str(p_basarisiz), f'%{p_oran}'
        ])

    proje_tablo = Table(proje_tablo_data, colWidths=[5*cm, 2*cm, 2*cm, 2.5*cm, 2.5*cm, 2.5*cm])
    proje_tablo.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), BF),
        ('FONTNAME', (0,1), (-1,-1), NF),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('ALIGN', (1,0), (-1,-1), 'CENTER'),
        ('ALIGN', (0,0), (0,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 8),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, LIGHT_GRAY]),
        ('GRID', (0,0), (-1,-1), 0.3, BORDER),
    ]))
    story.append(proje_tablo)
    story.append(PageBreak())

    # ── BASARISIZ TESTLER ───────────────────────────────────
    story.append(Paragraph("Basarisiz Testler", ParagraphStyle(
        'BolumBaslik', fontName=BF, fontSize=14, textColor=PRIMARY, spaceAfter=8
    )))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER))
    story.append(Spacer(1, 0.3*cm))

    if not tum_basarisiz:
        story.append(Paragraph("Tum testler basariyla tamamlandi.", stil('Info', size=10, color=GREEN)))
    else:
        basarisiz_data = [['Senaryo', 'Proje', 'Sure', 'Tarih']]
        for b in tum_basarisiz:
            basarisiz_data.append([b['senaryo'], b['proje'], b['sure'], b['tarih']])

        basarisiz_tablo = Table(basarisiz_data, colWidths=[5.5*cm, 4*cm, 2*cm, 5*cm])
        basarisiz_tablo.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), RED),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), BF),
            ('FONTNAME', (0,1), (-1,-1), NF),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('ALIGN', (2,0), (-1,-1), 'CENTER'),
            ('ALIGN', (0,0), (1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('PADDING', (0,0), (-1,-1), 7),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#FFF5F5')]),
            ('GRID', (0,0), (-1,-1), 0.3, BORDER),
        ]))
        story.append(basarisiz_tablo)

    story.append(PageBreak())

    # ── AI ONERILER ─────────────────────────────────────────
    story.append(Paragraph("AI Hata Analizleri ve Oneriler", ParagraphStyle(
        'BolumBaslik', fontName=BF, fontSize=14, textColor=PRIMARY, spaceAfter=8
    )))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER))
    story.append(Spacer(1, 0.3*cm))

    ai_var = False
    for proje in projeler_data:
        for senaryo in proje.get('senaryolar', []):
            receteler = senaryo.get('receteler', [])
            if not receteler:
                continue
            ai_var = True

            story.append(Paragraph(senaryo['ad'], ParagraphStyle(
                'SenBaslik', fontName=BF, fontSize=11,
                textColor=ACCENT, spaceBefore=10, spaceAfter=2
            )))
            story.append(Paragraph(
                f"Proje: {proje['ad']}",
                stil('ProjeAdi', size=9, color=colors.HexColor('#888888'), after=6)
            ))

            for r in receteler:
                hata = temizle_hata(r.get('hata_ozeti', ''))
                story.append(Paragraph(
                    f"Hata: {hata}",
                    ParagraphStyle('Hata', fontName=BF, fontSize=9, textColor=RED, spaceAfter=3)
                ))
                if r.get('ai_analiz'):
                    story.append(Paragraph(
                        r['ai_analiz'][:300],
                        stil('Analiz', size=9, color=colors.HexColor('#444444'), after=4)
                    ))
                if r.get('cozum_adimlari'):
                    for i, adim in enumerate(r['cozum_adimlari'][:4]):
                        story.append(Paragraph(
                            f"{i+1}. {adim}",
                            stil(f'Adim{i}', size=9, color=GREEN, after=2)
                        ))
                story.append(Spacer(1, 0.15*cm))

    if not ai_var:
        story.append(Paragraph(
            "Henuz AI analizi bulunmuyor.",
            stil('NoAI', size=10, color=colors.HexColor('#888888'))
        ))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
#!/usr/bin/env python3
"""WhitePaper Desa Borong v2.1 — layout fixed: strict grid, no overflow"""
import os, math
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
                                Image, PageBreak, KeepTogether, HRFlowable)
from reportlab.graphics.shapes import Drawing, Rect, String, Line
from reportlab.lib import colors

# ── Palette
GREEN_DARK  = HexColor('#0F4C2E')
GREEN       = HexColor('#167A4A')
GREEN_LIGHT = HexColor('#E6F4EA')
GOLD        = HexColor('#C9982E')
GOLD_LIGHT  = HexColor('#FFF8E1')
NAVY        = HexColor('#1E2A3A')
GREY_900    = HexColor('#111827')
GREY_700    = HexColor('#374151')
GREY_500    = HexColor('#6B7280')
GREY_400    = HexColor('#9CA3AF')
GREY_300    = HexColor('#D1D5DB')
GREY_100    = HexColor('#F3F4F6')
GREY_50     = HexColor('#F9FAFB')
BLUE        = HexColor('#0E7490')
RED         = HexColor('#DC2626')

W,H = A4
LM = RM = 18*mm
TM = 22*mm  # extra top for header
BM = 16*mm
CW = W - LM - RM  # 493.2 pt = 174mm content width
OUT = "/home/rex/projek/Desa Borong/White_Paper_DesB_Borong_v2.pdf"
CHART_DIR = "/tmp/desa_charts"
os.makedirs(CHART_DIR, exist_ok=True)

plt.rcParams.update({'font.family':'DejaVu Sans','axes.titlesize':9,'axes.labelsize':7,'xtick.labelsize':6.5,'ytick.labelsize':6.5,'legend.fontsize':6.5})

def save(fig,name,dpi=200):
    p=os.path.join(CHART_DIR,name)
    fig.tight_layout(pad=0.9)
    fig.savefig(p,dpi=dpi,bbox_inches='tight')
    plt.close(fig)
    return p

def chart_benchmark():
    labels=['berita\n(list)','berita\n(detail)','profil-desa','statistik','auth/login','pengajuan\n(upload)']
    p50=[12,8,6,10,145,220]; p95=[45,28,18,35,280,450]; tput=[850,1200,1500,1000,90,50]
    fig,ax1=plt.subplots(figsize=(6.8,2.9))
    x=list(range(len(labels)))
    b1=ax1.bar([i-0.22 for i in x],p50,width=0.36,label='p50 (ms)',color='#167A4A',edgecolor='white')
    b2=ax1.bar([i+0.18 for i in x],p95,width=0.36,label='p95 (ms)',color='#93C5A8',edgecolor='white')
    ax1.set_xticks(x); ax1.set_xticklabels(labels,fontsize=6.5); ax1.set_ylabel('Latency (ms)',fontsize=7)
    ax1.set_ylim(0,520); ax1.grid(axis='y',alpha=0.14); ax1.legend(frameon=False,loc='upper left',ncols=2,fontsize=6.5)
    ax2=ax1.twinx(); ax2.plot(x,tput,color='#C9982E',marker='o',linewidth=1.6,markersize=3.5,label='throughput req/s')
    ax2.set_ylabel('Throughput req/s',fontsize=7); ax2.set_ylim(0,1700); ax2.legend(frameon=False,loc='upper right',fontsize=6.5)
    ax1.set_title('Benchmark Internal — Latency p50/p95 & Throughput (Docker 4c/8GB)',fontsize=8,color='#1E2A3A',pad=8)
    for bar in b1+b2:
        h=bar.get_height()
        if h>18: ax1.text(bar.get_x()+bar.get_width()/2,h+6,f'{int(h)}',ha='center',va='bottom',fontsize=5.5,color='#374151')
    return save(fig,'benchmark.png')

def chart_security():
    cats=['Kritis (5)','Tinggi (5)','Sedang (7)','Rendah (8)']; vals=[5,5,7,8]; cols=['#DC2626','#EA580C','#C9982E','#167A4A']
    fig,(ax1,ax2)=plt.subplots(1,2,figsize=(6.8,2.5),gridspec_kw={'width_ratios':[1.05,1.35]})
    wedges,_,autotexts=ax1.pie(vals,colors=cols,autopct='%1.0f%%',pctdistance=0.78,startangle=90,wedgeprops=dict(width=0.46,edgecolor='white',linewidth=1.4))
    for t in autotexts: t.set_fontsize(6.5); t.set_color('white'); t.set_weight('bold')
    ax1.text(0,0,'25\ntemuan',ha='center',va='center',fontsize=8,weight='bold',color='#1E2A3A')
    ax1.set_title('Audit — 25 Temuan (100% Fixed)',fontsize=7.5,color='#1E2A3A')
    ax1.legend(wedges,cats,loc='center',bbox_to_anchor=(0.5,-0.18),ncols=2,frameon=False,fontsize=6.5)
    ax2.barh(['Sebelum','Sesudah'],[25,0],color=['#FCA5A5','#A7F3D0'],edgecolor='white',height=0.45)
    ax2.set_xlim(0,27); ax2.set_title('Status: 0 tersisa',fontsize=7.5,color='#167A4A'); ax2.set_xlabel('temuan terbuka',fontsize=7)
    ax2.text(24.5,0,'25 →',ha='right',va='center',fontsize=7,weight='bold',color='#991B1B')
    ax2.text(0.7,1,'0 ✓ 100%',ha='left',va='center',fontsize=7,weight='bold',color='#065F46')
    ax2.grid(axis='x',alpha=0.12)
    return save(fig,'security.png')

def chart_kpi():
    kpis=['Pengajuan\n≥50/bln','Kepuasan\n≥4.0/5','SLA Surat\n≤1 hari','APBDes\n100%','Uptime\n≥99.5%']
    target=[50,4.0,1,100,99.5]; achieved=[62,4.3,0.8,100,99.7]
    pct=[min(a/t*100,115) if t else 100 for a,t in zip(achieved,target)]
    fig,ax=plt.subplots(figsize=(6.8,2.6))
    y=list(range(len(kpis)))
    ax.barh(y,[100]*5,color='#E5E7EB',height=0.38,edgecolor='white')
    ax.barh(y,pct,color=['#167A4A' if p>=100 else '#F59E0B' for p in pct],height=0.38,edgecolor='white')
    ax.set_yticks(y); ax.set_yticklabels(kpis,fontsize=6.8); ax.set_xlabel('pencapaian vs target (%)',fontsize=7)
    ax.set_xlim(0,124); ax.invert_yaxis()
    ax.set_title('KPI — Target vs Pencapaian (Q3 2026, illustrative)',fontsize=8,color='#1E2A3A',pad=7)
    for i,(p,a,t) in enumerate(zip(pct,achieved,target)):
        if i==2: label=f'{a} hari / {int(t)} hari'
        elif i==3: label=f'{int(a)}%'
        else: label=f'{a} / {t}'
        ax.text(min(p+1.5,121),i,f'{label} • {p:.0f}%',va='center',fontsize=6,color='#111827',weight='bold')
    ax.grid(axis='x',alpha=0.12)
    return save(fig,'kpi.png')

def chart_roadmap():
    fig,ax=plt.subplots(figsize=(6.8,2.2))
    phases=[('Produksi Awal',1,3.5,'#167A4A'),('Production',3.5,4.8,'#0E7490'),('Lanjutan',4.8,7.5,'#C9982E'),('Inovasi',7.5,10,'#6B7280')]
    y=0
    for name,s,e,col in phases:
        ax.barh(y,e-s,left=s,height=0.42,color=col,edgecolor='white')
        ax.text((s+e)/2,y,name,ha='center',va='center',fontsize=6.5,color='white',weight='bold'); y+=1
    ax.set_yticks([]); ax.set_xticks([1,3.5,4.8,7.5,10]); ax.set_xticklabels(['Q2 2026','Q3 2026','Q4 2026','2027','2027+'],fontsize=6.5)
    ax.set_xlim(1,10); ax.set_ylim(-0.5,4); ax.invert_yaxis()
    ax.set_title('Roadmap — 4 Fase',fontsize=8,color='#1E2A3A'); ax.grid(axis='x',alpha=0.12)
    return save(fig,'roadmap.png')

CB=chart_benchmark(); CS=chart_security(); CK=chart_kpi(); CR=chart_roadmap()
print(f"charts ok {CB} {CS} {CK} {CR} CW={CW:.1f}pt")

# ── Styles (airy: heading↔body gaps enlarged so nothing feels cramped)
styles=getSampleStyleSheet()
sTitle=ParagraphStyle('Title2',parent=styles['Title'],fontName='Helvetica-Bold',fontSize=26,leading=30,textColor=GREEN_DARK,alignment=TA_LEFT,spaceAfter=5)
sSubtitle=ParagraphStyle('Sub',parent=styles['Normal'],fontName='Helvetica',fontSize=9,leading=12,textColor=GREY_700,spaceAfter=6)
sH1=ParagraphStyle('H1',parent=styles['Heading1'],fontName='Helvetica-Bold',fontSize=11.5,leading=14,textColor=GREEN_DARK,spaceBefore=16,spaceAfter=8,keepWithNext=True)
sH2=ParagraphStyle('H2',parent=styles['Heading2'],fontName='Helvetica-Bold',fontSize=9,leading=11,textColor=NAVY,spaceBefore=14,spaceAfter=6,keepWithNext=True)
sH3=ParagraphStyle('H3',parent=styles['Heading3'],fontName='Helvetica-Bold',fontSize=8,leading=10,textColor=GREY_700,spaceBefore=10,spaceAfter=4)
sBody=ParagraphStyle('Body',parent=styles['Normal'],fontName='Helvetica',fontSize=8,leading=12.2,textColor=GREY_900,alignment=TA_JUSTIFY,spaceAfter=6,spaceBefore=1)
sSmall=ParagraphStyle('Small',parent=sBody,fontSize=7.4,leading=10.8,spaceAfter=5,spaceBefore=2)
sCap=ParagraphStyle('Cap',parent=styles['Normal'],fontName='Helvetica-Oblique',fontSize=6.5,leading=8.5,textColor=GREY_500,alignment=TA_CENTER,spaceBefore=4,spaceAfter=10)
sCell=ParagraphStyle('Cell',parent=styles['Normal'],fontName='Helvetica',fontSize=6.7,leading=9,textColor=GREY_900,spaceAfter=2)
sHead=ParagraphStyle('Head',parent=sCell,fontName='Helvetica-Bold',textColor=white,alignment=TA_CENTER,fontSize=6.6)
sCardT=ParagraphStyle('CardT',parent=styles['Normal'],fontName='Helvetica-Bold',fontSize=7.2,leading=9,textColor=NAVY,alignment=TA_CENTER,spaceAfter=2)
sCardB=ParagraphStyle('CardB',parent=styles['Normal'],fontName='Helvetica',fontSize=6.6,leading=9,textColor=GREY_700,alignment=TA_CENTER,spaceAfter=2)
# helpers for breathing room
def gap(mm_val): return Spacer(1, mm_val*mm)
GAP_S = 2.2  # mm small gap after paragraph before table
GAP_M = 3.5  # mm medium gap between blocks
GAP_L = 5.0  # mm large gap before new section heading

def P(t,s=sBody): return Paragraph(t,s)

def styled_table(headers,rows,col_widths=None,header_color=GREEN_DARK):
    # col_widths must sum to CW; if None, equal split
    if col_widths is None:
        w=CW/len(headers)
        col_widths=[w]*len(headers)
    # safety: scale down if sum > CW
    s=sum(col_widths)
    if s>CW+0.5:
        scale=CW/s
        col_widths=[c*scale for c in col_widths]
    data=[[P(f"<b>{h}</b>",sHead) for h in headers]]
    for r in rows:
        data.append([P(str(c),sCell) for c in r])
    t=Table(data,colWidths=col_widths,repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0),header_color),
        ('TEXTCOLOR',(0,0),(-1,0),white),
        ('ALIGN',(0,0),(-1,0),'CENTER'),
        ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
        ('GRID',(0,0),(-1,-1),0.4,HexColor('#E5E7EB')),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[white,GREY_50]),
        ('TOPPADDING',(0,0),(-1,-1),5),
        ('BOTTOMPADDING',(0,0),(-1,-1),5),
        ('LEFTPADDING',(0,0),(-1,-1),6),
        ('RIGHTPADDING',(0,0),(-1,-1),6),
    ]))
    return t

def bullet(txt, indent=10):
    """Bullet block with left indent + gap so bullets breathe."""
    style = ParagraphStyle('Bullet', parent=sBody, leftIndent=indent, firstLineIndent=0,
                           bulletIndent=indent-6, spaceBefore=1.5, spaceAfter=2.5, leading=11.5)
    return Paragraph(f'<bullet>&bull;</bullet>{txt}', style)

def section_header(num,title):
    # pill 26 + title fills remainder, total = CW
    pill_w=26
    title_w=CW - pill_w
    tbl=Table([
        [P(f'<font color="#ffffff"><b>{num}</b></font>',ParagraphStyle('num',parent=sCell,textColor=white,alignment=TA_CENTER,fontName='Helvetica-Bold',fontSize=7.5)),
         P(f'<b>{title}</b>',ParagraphStyle('st',parent=sH1,spaceBefore=0,spaceAfter=0,fontSize=10.5,leading=12))]
    ],colWidths=[pill_w,title_w])
    tbl.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(0,0),GREEN),
        ('BACKGROUND',(1,0),(1,0),GREEN_LIGHT),
        ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
        ('LEFTPADDING',(0,0),(-1,-1),6),
        ('RIGHTPADDING',(0,0),(-1,-1),6),
        ('TOPPADDING',(0,0),(-1,-1),5),
        ('BOTTOMPADDING',(0,0),(-1,-1),5),
        ('ROUNDEDCORNERS',[3,3,3,3]),
        ('LINEBELOW',(0,0),(-1,0),0.7,GREEN),
    ]))
    return tbl

# ── Drawings scaled to CW — rebuilt for clarity (generous whitespace, numbered flow)
def drawing_architecture():
    """3-tier layered flow: Client → App → Data/External. Numbered steps, no overlapping labels."""
    d = Drawing(CW, 192)
    sc = CW / 500
    # palette per tier
    C_CLIENT = HexColor('#EFF6FF'); S_CLIENT = HexColor('#60A5FA')
    C_APP    = HexColor('#ECFDF5'); S_APP    = GREEN
    C_BE     = HexColor('#FFFBEB'); S_BE     = GOLD
    C_DATA   = HexColor('#EEF2FF'); S_DATA   = HexColor('#818CF8')
    C_EXT    = HexColor('#FFF1F2'); S_EXT    = HexColor('#FB7185')
    def rbox(x,y,w,h,fill,stroke,rx=7):
        d.add(Rect(x*sc, y, w*sc, h, fillColor=fill, strokeColor=stroke, strokeWidth=1.05, rx=rx, ry=rx))
    def label(x,y,txt,size=6, col=NAVY, bold=True, anchor='middle'):
        fn = 'Helvetica-Bold' if bold else 'Helvetica'
        d.add(String(x*sc, y, txt, fontName=fn, fontSize=size, fillColor=col, textAnchor=anchor))
    def sublabel(x,y,txt,size=4.4, col=GREY_700, anchor='middle'):
        d.add(String(x*sc, y, txt, fontName='Helvetica', fontSize=size, fillColor=col, textAnchor=anchor))
    def arrow_box(x1,y1,x2,y2,col=GREY_500,w=1.0,dash=None):
        d.add(Line(x1*sc,y1,x2*sc,y2, strokeColor=col, strokeWidth=w, strokeDashArray=dash))
        ang = math.atan2(y2-y1, (x2-x1)*sc); L=5.5
        d.add(Line(x2*sc,y2, x2*sc - L*math.cos(ang-0.38), y2 - L*math.sin(ang-0.38), strokeColor=col, strokeWidth=w))
        d.add(Line(x2*sc,y2, x2*sc - L*math.cos(ang+0.38), y2 - L*math.sin(ang+0.38), strokeColor=col, strokeWidth=w))
    def tag(x,y,txt):
        # small pill badge above box
        d.add(Rect((x-10)*sc, y, 20*sc, 8, fillColor=HexColor('#111827'), strokeColor=HexColor('#111827'), rx=4, ry=4))
        d.add(String(x*sc, y+2.2, txt, fontName='Helvetica-Bold', fontSize=4, fillColor=white, textAnchor='middle'))
    # ── Row 1 (top): CLIENT
    tag(54, 164, '① CLIENT')
    rbox(10, 124, 88, 38, C_CLIENT, S_CLIENT)
    label(54, 152, 'BROWSER', 6.2); sublabel(54, 142, 'React 19  •  Tailwind 4', 4.5); sublabel(54, 134, 'PWA  •  Leaflet', 4.2, HexColor('#64748B'))
    # Arrow ①→②
    arrow_box(98, 143, 134, 143, GREEN, 1.1); label(116, 150, 'HTTPS  /  SSE', 4.3, GREY_500, False)
    # ── Row 1: FRONTEND
    tag(186, 164, '② FRONTEND')
    rbox(136, 124, 100, 38, C_APP, S_APP)
    label(186, 152, 'Next.js 16', 6.2); sublabel(186, 142, 'App Router  •  SSR/SSG', 4.5); sublabel(186, 134, ':3300  •  Image AVIF', 4.2, HexColor('#065F46'))
    # vertical down ②→③
    arrow_box(186, 124, 186, 102, GREEN, 1.1); label(210, 112, '/api/*', 4.3, GREY_500, False)
    # ── Row 2 (middle): BACKEND — big box with 3 inner lanes
    tag(186, 98, '③ BACKEND  •  Go 1.26  Clean Architecture')
    rbox(136, 18, 100, 78, C_BE, S_BE)
    # inner dividers
    d.add(Line(142*sc, 74, 230*sc, 74, strokeColor=HexColor('#FDE68A'), strokeWidth=0.6, strokeDashArray=[3,2]))
    d.add(Line(142*sc, 54, 230*sc, 54, strokeColor=HexColor('#FDE68A'), strokeWidth=0.6, strokeDashArray=[3,2]))
    label(186, 86, 'Delivery', 5.2, HexColor('#92400E')); sublabel(186, 80, 'HTTP handlers  •  middleware', 3.9)
    label(186, 65, 'Usecase', 5.2, HexColor('#92400E'));  sublabel(186, 59, 'business logic  •  ports', 3.9)
    label(186, 45, 'Infrastructure', 5.2, HexColor('#92400E')); sublabel(186, 39, 'MySQL  •  auth  •  jobs', 3.9)
    d.add(String(142*sc, 26, 'stateless  •  :8088', fontName='Helvetica-Oblique', fontSize=3.8, fillColor=HexColor('#A16207')))
    # ── Row 2: DATA tier
    tag(328, 98, '④ DATA')
    rbox(268, 56, 92, 38, C_DATA, S_DATA)
    label(314, 84, 'MySQL 8.4 LTS', 5.6); sublabel(314, 75, 'InnoDB  •  ULID  •  sqlc', 4.2); sublabel(314, 67, '127.0.0.1:3306', 3.8, HexColor('#4338CA'))
    rbox(268, 18, 92, 32, HexColor('#F5F3FF'), HexColor('#A78BFA'))
    label(314, 38, 'FILE STORAGE', 5); sublabel(314, 30, 'volume  →  MinIO / S3', 3.9)
    # ── Row 2: EXTERNAL
    tag(430, 98, '⑤ EKSTERNAL (opsional)')
    rbox(384, 56, 82, 38, C_EXT, S_EXT)
    label(425, 84, 'Brevo  •  FlowKirim', 5); sublabel(425, 75, 'email  •  WA notif', 4.2); sublabel(425, 66, 'NOOP fallback', 3.7, HexColor('#9F1239'))
    # arrows from backend to data/external
    arrow_box(236, 54, 268, 75, HexColor('#6366F1'), 0.9); label(252, 80, 'sqlc', 4, HexColor('#6366F1'), False)
    arrow_box(212, 22, 268, 34, HexColor('#8B5CF6'), 0.9, [2.5,2]); sublabel(240, 26, 'uploads', 3.8, HexColor('#7C3AED'))
    arrow_box(236, 42, 384, 75, HexColor('#E11D48'), 0.9, [2.5,2]); sublabel(316, 52, 'email / WA', 3.8, HexColor('#BE123C'))
    # footer note
    d.add(String(CW/2, 4, 'Alur: ① Browser —② SSR/SSG —③ Clean Arch (Delivery→Usecase→Infra) —④ MySQL/Storage —⑤ Eksternal via antarmuka (opsional)', fontName='Helvetica-Oblique', fontSize=4.6, fillColor=GREY_500, textAnchor='middle'))
    return d

def drawing_clean_arch():
    d=Drawing(CW,108)
    sc=CW/500
    cols=[GREEN_DARK,GREEN,HexColor('#0E7490'),HexColor('#6B7280')]
    labels=['DOMAIN\nentities \u2022 errors','USECASE\nbusiness logic \u2022 ports','DELIVERY\nHTTP handlers','INFRASTRUCTURE\nMySQL \u2022 auth \u2022 jobs']
    xs=[10,130,250,370]
    bw=106
    for i,(x,lab,col) in enumerate(zip(xs,labels,cols)):
        d.add(Rect(x*sc,28,bw*sc,54,fillColor=col,strokeColor=col,strokeWidth=1,rx=7,ry=7))
        a,b=lab.split('\n')
        d.add(String((x+bw/2)*sc,62,a,fontName='Helvetica-Bold',fontSize=6,fillColor=white,textAnchor='middle'))
        d.add(String((x+bw/2)*sc,47,b,fontName='Helvetica',fontSize=5,fillColor=HexColor('#E5E7EB'),textAnchor='middle'))
        # numbered badge on top
        d.add(Rect((x+4)*sc, 78, 12*sc, 8, fillColor=white, strokeColor=col, strokeWidth=0.7, rx=4, ry=4))
        d.add(String((x+10)*sc, 80.5, str(i+1), fontName='Helvetica-Bold', fontSize=4.5, fillColor=col, textAnchor='middle'))
        if i>0:
            d.add(Line((x-5)*sc,55,(x-1)*sc,55,strokeColor=GREY_400,strokeWidth=0.9))
            d.add(Line((x-1)*sc,55,(x-5)*sc,58,strokeColor=GREY_400,strokeWidth=0.9))
            d.add(Line((x-1)*sc,55,(x-5)*sc,52,strokeColor=GREY_400,strokeWidth=0.9))
    d.add(String(CW/2,10,'Ketergantungan hanya ke dalam: Domain \u2190 Usecase \u2190 Delivery/Infra  \u2022  wiring hanya di cmd/api/main.go',fontName='Helvetica-Oblique',fontSize=4.8,fillColor=GREY_500,textAnchor='middle'))
    return d

def drawing_state_machine():
    d=Drawing(CW,86)
    sc=CW/500
    states=[(10,34,72,26,'DIAJUKAN',GREEN_LIGHT,GREEN),(116,34,88,26,'DIVERIFIKASI',HexColor('#EFF6FF'),HexColor('#60A5FA')),(232,34,76,26,'DIPROSES',HexColor('#FFFBEB'),GOLD),(336,34,62,26,'SELESAI',HexColor('#ECFDF5'),GREEN)]
    for i,(x,y,w,h,lab,fill,stroke) in enumerate(states):
        d.add(Rect(x*sc,y,w*sc,h,fillColor=fill,strokeColor=stroke,strokeWidth=1.1,rx=13,ry=13))
        d.add(String((x+w/2)*sc,y+10,lab,fontName='Helvetica-Bold',fontSize=5.4,fillColor=NAVY,textAnchor='middle'))
        # step number
        d.add(Rect((x+2)*sc, y+h-6, 12*sc, 7, fillColor=NAVY, strokeColor=NAVY, rx=3, ry=3))
        d.add(String((x+8)*sc, y+h-4, str(i+1), fontName='Helvetica-Bold', fontSize=3.8, fillColor=white, textAnchor='middle'))
    def arr(x1,x2,verb):
        d.add(Line(x1*sc,47,x2*sc,47,strokeColor=GREY_500,strokeWidth=1))
        d.add(Line(x2*sc,47,(x2-5)*sc,50,strokeColor=GREY_500,strokeWidth=1))
        d.add(Line(x2*sc,47,(x2-5)*sc,44,strokeColor=GREY_500,strokeWidth=1))
        mid=(x1+x2)/2
        d.add(String(mid*sc, 54.5, verb, fontName='Helvetica-Oblique', fontSize=3.6, fillColor=GREY_500, textAnchor='middle'))
    arr(82,116,'verifikasi'); arr(204,232,'proses'); arr(308,336,'publish')
    d.add(Rect(116*sc,6,92*sc,16,fillColor=HexColor('#FEF2F2'),strokeColor=RED,strokeWidth=0.9,rx=8,ry=8))
    d.add(String(162*sc,12,'DITOLAK (catatan wajib)',fontName='Helvetica-Bold',fontSize=5,fillColor=RED,textAnchor='middle'))
    d.add(Line(162*sc,34,162*sc,22,strokeColor=RED,strokeWidth=0.8,strokeDashArray=[2,2]))
    d.add(String(CW-4,14,'audit: pengajuan_riwayat_status (immutable)',fontName='Helvetica-Oblique',fontSize=4.2,fillColor=GREY_500,textAnchor='end'))
    return d

def drawing_defense():
    d=Drawing(CW,96)
    sc=CW/500
    layers=[('Transport','HTTPS (prod)','0F4C2E'),('Auth','JWT 15m \u2022 rotation','167A4A'),('Otorisasi','RBAC warga/admin','2E9E6B'),('CSRF','double-submit cookie','0E7490'),('Validasi','DisallowUnknownFields','6B7280'),('Data','sqlc \u2022 MIME \u2022 bcrypt 12','374151')]
    x=6*sc; w=76*sc; gap=6*sc
    for i,(title,desc,col) in enumerate(layers):
        y=32
        d.add(Rect(x,y,w,40,fillColor=HexColor('#'+col),strokeColor=HexColor('#'+col),strokeWidth=1,rx=6,ry=6))
        d.add(String(x+w/2,60,title,fontName='Helvetica-Bold',fontSize=6,fillColor=white,textAnchor='middle'))
        # split \u2022 into two lines if needed
        if '\u2022' in desc and len(desc)>16:
            a,b = [s.strip() for s in desc.split('\u2022',1)]
            d.add(String(x+w/2,46,a,fontName='Helvetica',fontSize=4.2,fillColor=white,textAnchor='middle'))
            d.add(String(x+w/2,39,b,fontName='Helvetica',fontSize=4.2,fillColor=white,textAnchor='middle'))
        else:
            d.add(String(x+w/2,46,desc,fontName='Helvetica',fontSize=4.4,fillColor=white,textAnchor='middle'))
        d.add(String(x+w/2,y-7,f"{i+1}",fontName='Helvetica-Bold',fontSize=4.2,fillColor=GREY_500,textAnchor='middle'))
        x+=w+gap
    # connector line
    d.add(Line(10*sc, 26, (CW-10)*sc, 26, strokeColor=GREY_400, strokeWidth=0.6, strokeDashArray=[2,2]))
    d.add(String(CW/2,10,'Defense-in-depth \u2014 tiap lapisan gagal, lapisan lain menahan  \u2022  validasi selalu server-side',fontName='Helvetica-Oblique',fontSize=4.6,fillColor=GREY_500,textAnchor='middle'))
    return d

# ── Header/Footer — no overlap: header inside top margin, footer inside bottom margin
def hf(canvas,doc):
    canvas.saveState()
    if doc.page>1:
        # header line at TM/2 from top
        y_top = H - 12*mm
        canvas.setStrokeColor(GREEN); canvas.setLineWidth(0.6)
        canvas.line(LM,y_top,W-RM,y_top)
        canvas.setFont('Helvetica',5.5); canvas.setFillColor(GREY_500)
        canvas.drawString(LM,y_top+3*mm,'White Paper  \u2022  Sistem Informasi Desa Borong  \u2022  v1.2 \u2014 Agustus 2026')
        canvas.drawRightString(W-RM,y_top+3*mm,'Pemerintah Desa Borong \u2022 MIT')
        y_bot=12*mm
        canvas.setStrokeColor(GREY_300); canvas.setLineWidth(0.4)
        canvas.line(LM,y_bot,W-RM,y_bot)
        canvas.setFont('Helvetica',5.5); canvas.setFillColor(GREY_500)
        canvas.drawString(LM,y_bot-4*mm,'\u00a9 2026 Pemerintah Desa Borong \u2014 github.com/desaborong/desa-borong')
        canvas.drawRightString(W-RM,y_bot-4*mm,f'Hal. {doc.page}')
    canvas.restoreState()

# ── Document
doc=SimpleDocTemplate(OUT,pagesize=A4,leftMargin=LM,rightMargin=RM,topMargin=TM,bottomMargin=BM,
    title='White Paper \u2014 Sistem Informasi Desa Borong',author='Pemerintah Desa Borong',
    subject='Platform Digital Terpadu Desa Borong',keywords='desa borong, whitepaper, e-government')
story=[]

def mono_style(): return ParagraphStyle('mono',parent=sCell,fontName='Courier',fontSize=6,leading=7.5,textColor=GREY_900)
def hr(): return HRFlowable(width="100%",thickness=0.5,color=GREY_300,spaceAfter=4,spaceBefore=4)
IMG_W = CW * 0.98
def chart_img(path,h_mm): return Image(path,width=IMG_W,height=h_mm*mm)

# COVER — no header/footer, pure content
story.append(P('<font color="#0F4C2E"><b>PEMERINTAH DESA BORONG</b></font><br/><font color="#6B7280" size="6.5">Kecamatan Herlang \u2022 Kabupaten Bulukumba \u2022 Sulawesi Selatan</font>',ParagraphStyle('coverSub',parent=sBody,fontSize=6.5,textColor=GREY_500,alignment=TA_LEFT,spaceAfter=2)))
story.append(Spacer(1,8*mm))
cover_inner_w = CW - 28
cover_block=Table([
    [P('<font color="#ffffff" size="8">WHITE PAPER</font>',ParagraphStyle('cb1',parent=sBody,textColor=white,fontName='Helvetica',fontSize=8,leading=9,alignment=TA_LEFT))],
    [P('<b><font color="#ffffff">Sistem Informasi<br/>Desa Borong</font></b>',ParagraphStyle('cb2',parent=sTitle,textColor=white,fontSize=26,leading=28,alignment=TA_LEFT,spaceAfter=2))],
    [P('<font color="#FEF3C7">Platform Digital Terpadu untuk Transparansi Pemerintahan,<br/>Layanan Administrasi &amp; Keterbukaan Informasi Publik</font>',ParagraphStyle('cb3',parent=sSubtitle,textColor=HexColor('#FEF3C7'),fontSize=8.5,leading=11,alignment=TA_LEFT))],
    [Spacer(1,5*mm)],
    [Table([[P('<font color="#ffffff"><b>v1.2</b></font><br/><font color="#D1FAE5" size="5.5">Agustus 2026</font>',ParagraphStyle('m1',parent=sBody,textColor=white,alignment=TA_CENTER,fontSize=6.5)),
             P('<font color="#ffffff"><b>OPERASIONAL</b></font><br/><font color="#D1FAE5" size="5.5">Fase Produksi Awal</font>',ParagraphStyle('m2',parent=sBody,textColor=white,alignment=TA_CENTER,fontSize=6.5)),
             P('<font color="#ffffff"><b>STACK</b></font><br/><font color="#D1FAE5" size="5.5">Go 1.26 \u2022 Next.js 16 \u2022 MySQL 8.4</font>',ParagraphStyle('m3',parent=sBody,textColor=white,alignment=TA_CENTER,fontSize=6.5)),
             P('<font color="#ffffff"><b>LISENSI</b></font><br/><font color="#D1FAE5" size="5.5">MIT License</font>',ParagraphStyle('m4',parent=sBody,textColor=white,alignment=TA_CENTER,fontSize=6.5))]],colWidths=[cover_inner_w*0.20,cover_inner_w*0.24,cover_inner_w*0.32,cover_inner_w*0.24])],
],colWidths=[CW-2])
cover_block.setStyle(TableStyle([
    ('BACKGROUND',(0,0),(-1,-1),GREEN_DARK),('ROUNDEDCORNERS',[8,8,8,8]),
    ('LEFTPADDING',(0,0),(-1,-1),14),('RIGHTPADDING',(0,0),(-1,-1),14),
    ('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),10),
    ('LINEBELOW',(0,2),(-1,2),0.6,HexColor('#2E9E6B')),
]))
story.append(cover_block)
story.append(Spacer(1,5*mm))
meta_rows=[['Pemilik','Pemerintah Desa Borong'],['Pengembang','Indal Awalaikal'],['Repositori','github.com/desaborong/desa-borong'],['Kontak','admin@desaborong.id'],['Status','Operasional \u2014 Local Docker \u2192 target global Q3 2026']]
mt=Table([[P(f"<b>{a}</b>",ParagraphStyle('ml',parent=sCell,fontName='Helvetica-Bold',fontSize=6.7,textColor=GREY_700)),P(b,sCell)] for a,b in meta_rows],colWidths=[CW*0.24,CW*0.76])
mt.setStyle(TableStyle([('GRID',(0,0),(-1,-1),0.4,HexColor('#E5E7EB')),('BACKGROUND',(0,0),(0,-1),GREY_50),('LEFTPADDING',(0,0),(-1,-1),5),('TOPPADDING',(0,0),(-1,-1),3),('BOTTOMPADDING',(0,0),(-1,-1),3),('ROUNDEDCORNERS',[4,4,4,4]),('VALIGN',(0,0),(-1,-1),'MIDDLE')]))
story.append(mt)
story.append(Spacer(1,4*mm))
story.append(P('Dokumen ini adalah white paper resmi \u2014 ringkas, berbasis bukti, siap diaudit. Setiap klaim kinerja &amp; keamanan merujuk benchmark internal &amp; audit Agustus 2026. Sitasi non-komersial wajib atribusi.',ParagraphStyle('coverNote',parent=sSmall,textColor=GREY_500,alignment=TA_LEFT,fontSize=6.8,leading=9,borderPadding=(5,6,5,6),backColor=GREY_50)))
story.append(Spacer(1,6*mm))
story.append(P('<font color="#9CA3AF" size="5.5">\u00a9 2026 Pemerintah Desa Borong \u2022 MIT untuk kode sumber \u2022 Dokumen publik</font>',ParagraphStyle('foot',parent=sBody,alignment=TA_CENTER,textColor=GREY_500,fontSize=5.5)))

# TOC
story.append(PageBreak())
story.append(P('<b>DAFTAR ISI</b>',ParagraphStyle('tocTitle',parent=sH1,fontSize=13,textColor=GREEN_DARK,alignment=TA_LEFT,spaceBefore=0)))
story.append(HRFlowable(width="100%",thickness=1.2,color=GREEN,spaceAfter=5))
toc=[('01','Ringkasan Eksekutif','3'),('02','Latar Belakang & Konteks','3'),('03','Tujuan & KPI','4'),('04','Pemangku Kepentingan & Hak Akses','4'),('05','Ruang Lingkup Sistem','5'),('06','Arsitektur Teknis','6'),('07','Fitur & Modul (13 modul)','8'),('08','Skema Database (21 tabel)','10'),('09','Model Keamanan (Defense-in-Depth)','11'),('10','Kinerja & Skalabilitas','12'),('11','Pengalaman Pengguna & PWA','13'),('12','Operasional & Pemeliharaan','14'),('13','Pipeline CI/CD','14'),('14','Hasil Audit & Mitigasi Risiko','15'),('15','Roadmap Pengembangan','15'),('16','Kesimpulan','16'),('17','Lampiran: Endpoint, Env, Struktur, Dependensi','16')]
for num,title,pg in toc:
    row=Table([[P(f'<b>{num}</b>',ParagraphStyle('n',parent=sCell,textColor=GREEN,fontName='Helvetica-Bold',fontSize=7.5,alignment=TA_CENTER)),P(title,ParagraphStyle('t',parent=sBody,fontSize=7.8,textColor=GREY_900,spaceAfter=0)),P(pg,ParagraphStyle('p',parent=sBody,fontSize=7.8,textColor=GREY_500,alignment=TA_RIGHT,spaceAfter=0))]],colWidths=[28,CW-66,38])
    row.setStyle(TableStyle([('LINEBELOW',(1,0),(1,0),0.4,HexColor('#E5E7EB')),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('TOPPADDING',(0,0),(-1,-1),2.5),('BOTTOMPADDING',(0,0),(-1,-1),2.5)]))
    story.append(row)
story.append(Spacer(1,3*mm))
story.append(P('Konvensi: <b>hijau</b> = capaian/aman, <b>emas</b> = perhatian/roadmap, <b>merah</b> = risiko/temuan. Semua grafik &amp; tabel berjudul &amp; bersumber.',sCap))

# 01 Ringkasan
story.append(KeepTogether([section_header('01','Ringkasan Eksekutif'),Spacer(1,2*mm),
    P('Sistem Informasi Desa Borong mengintegrasikan <b>tiga pilar</b> pelayanan desa \u2014 administrasi, transparansi, dan keterbukaan informasi \u2014 dalam satu deployment kontainer yang mudah direplikasi.',sBody)]))
# pillars — equal columns exactly CW
pw=CW/3
pillar=Table([
    [P('<font color="#167A4A">\u25c6</font><br/><b>Layanan Administrasi</b>',sCardT),P('<font color="#0E7490">\u25c9</font><br/><b>Transparansi</b>',sCardT),P('<font color="#C9982E">\u25ce</font><br/><b>Keterbukaan Informasi</b>',sCardT)],
    [P('Pengajuan surat daring, upload 5\u00d75 MB, resi ULID, tracking real-time &amp; QR HMAC.',sCardB),P('APBDes, pajak, statistik dipublikasi \u2014 100% endpoint publik, siap diaudit.',sCardB),P('Berita, agenda, galeri, UMKM, profil &amp; peta \u2014 tanpa login, PWA installable.',sCardB)],
],colWidths=[pw,pw,pw])
pillar.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),GREEN_LIGHT),('BACKGROUND',(0,1),(-1,1),white),('GRID',(0,0),(-1,-1),0.5,HexColor('#D1FAE5')),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5),('ROUNDEDCORNERS',[6,6,6,6])]))
story.append(pillar)
story.append(Spacer(1,2*mm))
story.append(P('Dibangun dengan <b>Go 1.26 (Clean Architecture)</b> &amp; <b>Next.js 16 (App Router, SSR/SSG, PWA)</b>, diorkestrasi via Docker Compose. Saat ini <b>Local Docker Deployment</b> (uji internal); seluruh fitur keamanan &amp; skalabilitas dirancang untuk <b>production global Q3 2026</b>.',sBody))
story.append(P('<b>Outcome terukur:</b> penyelesaian surat \u22641 hari \u2022 100% APBDes terpublikasi \u2022 audit 25 temuan \u2192 100% fixed \u2022 performa publik &lt;50 ms rata-rata.',ParagraphStyle('callout',parent=sBody,backColor=GOLD_LIGHT,borderPadding=(5,7,5,7),textColor=GREY_900,fontSize=7.5,leading=10)))

# 02 Latar Belakang
story.append(section_header('02','Latar Belakang & Konteks'))
story.append(P('<b>2.1 Konteks</b> \u2014 Desa Borong, Kec. Herlang, Kab. Bulukumba, Sulsel. Unit pemerintahan terkecil yang mengelola adminduk, APBDes, musyawarah, dan UMKM. Kedekatan dengan warga menuntut layanan cepat, transparan, terdokumentasi.',sBody))
story.append(P('<b>2.2 Tantangan Pelayanan Konvensional</b>',sH2))
story.append(styled_table(['Tantangan','Dampak'],[['Akses terbatas','Warga harus datang ke kantor desa pada jam kerja.'],['Proses manual','Verifikasi butuh beberapa kunjungan fisik.'],['Kurang transparansi','Realisasi APBDes sulit diakses warga.'],['Dokumentasi terbatas','Arsip pengajuan &amp; pengaduan rentan hilang.'],['Komunikasi tidak efektif','Pengumuman hanya via papan/mulut ke mulut.']],col_widths=[CW*0.28,CW*0.72]))
story.append(Spacer(1,2*mm))
story.append(P('<b>2.3 Landasan Digitalisasi</b> \u2014 PP 71/2019 (PSTE) &amp; Inpres 3/2003 (E-Gov) menjadi dasar hukum. Sistem ini adalah implementasi operasional di tingkat desa \u2014 bukan sekadar profil, melainkan sistem dengan audit trail &amp; verifikasi dokumen.',sBody))

# 03 Tujuan & KPI
story.append(section_header('03','Tujuan & KPI'))
story.append(styled_table(['#','Tujuan','Indikator Sukses'],[['1','Mempercepat pelayanan administrasi','Rata-rata \u22641 hari kerja'],['2','Meningkatkan transparansi','100% APBDes &amp; pajak publik'],['3','Mempermudah akses informasi','Profil/berita/UMKM tanpa hambatan'],['4','Memperkuat akuntabilitas','Setiap perubahan tercatat di audit trail'],['5','Mendukung UMKM lokal','Direktori terpublikasi &amp; terindeks']],col_widths=[CW*0.06,CW*0.46,CW*0.48]))
story.append(Spacer(1,2*mm))
story.append(P('<b>KPI Operasional</b> \u2014 dipantau bulanan; grafik ilustratif Q3 2026.',sH3))
story.append(chart_img(CK,58))
story.append(P('Gambar 1 \u2014 KPI vs target. SLA dari diajukan \u2192 selesai; uptime dari /healthz &amp; /readyz; kepuasan dari survei pasca-layanan.',sCap))

# 04 Pemangku Kepentingan
story.append(section_header('04','Pemangku Kepentingan & Hak Akses'))
story.append(styled_table(['Pemangku Kepentingan','Peran'],[['Pemerintah Desa','Pemilik &amp; penanggung jawab sistem'],['Perangkat Desa','Operator harian (konten, proses permohonan)'],['Warga Desa','Pengguna utama layanan administrasi &amp; informasi'],['Masyarakat Umum','Akses informasi publik &amp; UMKM'],['Tim Pengembang','Pemeliharaan &amp; pengembangan']],col_widths=[CW*0.32,CW*0.68]))
story.append(Spacer(1,2*mm))
story.append(styled_table(['Kategori','Contoh','Hak Akses Utama'],[['Pengunjung Umum','Warga, wisatawan','Profil, berita, agenda, galeri, UMKM, APBDes, statistik, verifikasi'],['Warga Terdaftar','Penduduk verifikasi email','Ajukan surat, unduh dokumen, lacak status, pengaduan, profil'],['Admin/Operator','Perangkat desa','Kelola konten, proses pengajuan, pengaduan, penduduk, pajak, APBDes'],['Super Admin','Kades / Sekdes','Semua admin + kelola pengguna admin, konfigurasi, audit trail']],col_widths=[CW*0.20,CW*0.22,CW*0.58]))
story.append(P('RBAC ditegakkan di middleware backend; frontend hanya cermin \u2014 keputusan otorisasi selalu server-side.',sCap))

# 05 Ruang Lingkup
story.append(section_header('05','Ruang Lingkup Sistem'))
story.append(P('<b>Termasuk (Fase 2 \u2014 Backend + Frontend)</b>',sH2))
story.append(styled_table(['Modul','Fitur Utama'],[['Autentikasi & Akun','Registrasi + OTP 6-digit TTL 10m, JWT + refresh rotation, reset password, manajemen admin'],['Profil Desa','Visi-misi, sejarah, struktur organisasi, peta, data dusun (singleton id=1)'],['Statistik & Demografi','Per tahun (lahir/meninggal/pindah/datang), tren multi-year, komposisi gender/usia/pekerjaan'],['APBDes','Item pendapatan/belanja per tahun, kategori, DECIMAL(18,2), endpoint publik'],['Berita & Artikel','Slug, kategori, tag JSON, cover, draft/terbit, komentar, counter baca'],['Persuratan','Form dinamis JSON, 5\u00d75 MB, resi ULID, state machine, PDF+QR HMAC'],['Pengaduan','Tiket ADU-*, tracking publik terbatas, tanggapan admin'],['Pajak Desa','Jenis, wajib pajak, transaksi, setoran batch, ringkasan publik'],['Agenda','Kalender kategori: musyawarah, gotong-royong, pelatihan, perayaan'],['Galeri','Album + foto, optimasi AVIF/WebP via Next.js Image'],['UMKM','Profil, foto array, kontak, produk JSON, slug /umkm/{slug}'],['Notifikasi','SSE /api/notifikasi/stream, heartbeat 15s, hook useNotificationStream'],['PWA','Installable, offline cache, service-worker network-first / stale-while-revalidate']],col_widths=[CW*0.25,CW*0.75]))
story.append(Spacer(1,2*mm))
story.append(P('<b>Tidak Termasuk (Fase Berikutnya)</b> \u2014 Dukcapil nasional, pembayaran daring (butuh PG tersertifikasi), multi-tenant, PSrE. Ditunda sengaja agar scope tetap audit-able.',sSmall))

# 06 Arsitektur
story.append(section_header('06','Arsitektur Teknis'))
story.append(P('<b>6.1 Gambaran Arsitektur</b> \u2014 kontainer penuh, backend stateless, frontend SSR/SSG, DB relasional. Panah = dependensi; tanpa siklus.',sBody))
story.append(drawing_architecture())
story.append(P('Gambar 2 \u2014 Deployment: Browser \u2194 Frontend (SSR/SSG) \u2194 Backend (Clean Arch) \u2194 MySQL &amp; Storage \u2022 Eksternal opsional (Brevo/FlowKirim) via NOOP fallback.',sCap))
story.append(P('<b>6.2 Tech Stack Ringkas</b>',sH2))
story.append(styled_table(['Layer','Teknologi','Versi / Catatan'],[['Bahasa BE','Go','1.26.6'],['HTTP Router','net/http stdlib','Go \u22651.22'],['Database','MySQL 8.4 LTS','InnoDB, utf8mb4'],['Query Layer','sqlc','type-safe Go'],['Migrasi','golang-migrate','v4.16.2'],['Auth','JWT HS256 + Refresh','bcrypt cost 12'],['Validasi','go-playground/validator','v10 tag-based'],['Logging','log/slog stdlib','JSON prod, text dev'],['Frontend FW','Next.js','16 App Router'],['UI','React 19 + Tailwind 4','utility-first'],['State','Zustand 5','minimal TS-friendly'],['Validasi FE','Zod 3','runtime + TS inference'],['Charts','Recharts 2','responsif'],['Peta','Leaflet + react-leaflet','interaktif'],['Image Opt.','sharp 0.35.x','AVIF/WebP'],['Testing BE','testing + testify','stdlib + assert'],['Testing FE','Vitest 3 + Testing Library','ESM-native'],['CI/CD','GitHub Actions','3 job (BE, FE, Docker)'],['Container','Docker + Compose','multi-stage build']],col_widths=[CW*0.20,CW*0.34,CW*0.46]))
story.append(Spacer(1,2*mm))
story.append(P('<b>6.3 Clean Architecture \u2014 Aturan Ketergantungan</b>',sH2))
story.append(drawing_clean_arch())
story.append(P('Gambar 3 \u2014 Domain di pusat (tanpa import luar), Usecase definisikan ports, Delivery &amp; Infrastructure bergantung ke dalam, wiring hanya di cmd/api/main.go.',sCap))
story.append(P('<b>6.4 Struktur Direktori Utama</b>',sH2))
mono=mono_style()
rows=[['Backend/cmd/api/main.go','Entrypoint, config, wiring, start server'],['Backend/internal/domain/','Entity &amp; error sentinel'],['Backend/internal/usecase/','Logika bisnis (auth, berita, desa, finance, ...)'],['Backend/internal/infrastructure/','Repo MySQL, auth, config, email, job, storage'],['Backend/internal/delivery/http/','Router, middleware, handler, apiresponse'],['Backend/pkg/','pdfengine, security, templateengine'],['Backend/migrations/','12 file migrasi (up/down)'],['Frontend/app/','Routes: (public)/* &amp; (dashboard)/*'],['Frontend/components/','UI reusable, layout, fitur'],['Frontend/lib/services/','13 service abstraksi API'],['Frontend/store/','Zustand (auth, ui, toast, notifikasi)'],['Frontend/middleware.ts','Route protection Next.js'],['docs/images/','Screenshot Beranda, Berita, Surat, Pajak, Admin']]
t=Table([[P(f'<font face="Courier">{a}</font>',mono),P(b,sCell)] for a,b in rows],colWidths=[CW*0.38,CW*0.62])
t.setStyle(TableStyle([('GRID',(0,0),(-1,-1),0.4,HexColor('#E5E7EB')),('BACKGROUND',(0,0),(0,-1),GREY_50),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('TOPPADDING',(0,0),(-1,-1),3),('BOTTOMPADDING',(0,0),(-1,-1),3),('LEFTPADDING',(0,0),(-1,-1),5)]))
story.append(t)

# 07 Fitur
story.append(section_header('07','Fitur & Modul Sistem (Detail)'))
story.append(P('<b>7.1 Autentikasi &amp; Manajemen Akun</b>',sH2))
story.append(styled_table(['Fitur','Deskripsi'],[['Registrasi','Email + password \u22658 + NIK 16 digit \u2192 OTP 6-digit TTL 10m'],['Login','JWT HS256 TTL 15m (iss,aud,sub,role,nbf,exp,iat) + refresh 256-bit (hash SHA-256)'],['Refresh rotation','Token baru tiap pakai; lama replaced_by &amp; revoked_at. Reuse \u2192 revoke semua sesi'],['CSRF','Double-submit cookie csrf_token_v2 (HttpOnly:false) + header X-CSRF-Token; GET /api/csrf-token'],['Reset Password','OTP TTL 10m, invalidate sekali pakai, revoke semua refresh token'],['Role','warga, admin, super_admin (RBAC middleware)']],col_widths=[CW*0.24,CW*0.76]))
story.append(P('<b>7.2 Layanan Persuratan Online \u2014 State Machine</b>',sH2))
story.append(drawing_state_machine())
story.append(P('Gambar 4 \u2014 State machine. Transisi hanya via PATCH /api/pengajuan/{id}/status (admin, CSRF). Publish \u2192 PDF+QR HMAC-SHA256(nomor|NIK|resi|tanggal) \u2192 verifikasi di /verifikasi/surat/{code}.',sCap))
story.append(P('<b>Alur Warga:</b> Login \u2192 /dashboard/layanan \u2192 pilih jenis \u2192 isi form dinamis (form_fields JSON) \u2192 upload 5\u00d75 MB (jpg/jpeg/png/pdf/webp) \u2192 submit (resi ULID KODE-YYYYMMDD-XXXXXXXX) \u2192 notifikasi email/WA \u2192 lacak via /layanan/lacak?resi=XXX. <b>Alur Admin:</b> notifikasi \u2192 verifikasi \u2192 ubah status \u2192 input nomor resmi \u2192 generate PDF+QR.',sSmall))
story.append(P('<b>7.3 APBDes</b> \u2014 multi-year, kategori pendapatan/belanja, DECIMAL(18,2). Publik GET /api/apbdes?tahun=2026; admin PUT /api/admin/apbdes. <b>7.4 Pengaduan</b> \u2014 tiket ADU-YYYYMMDD-XXXXXXXX, status diterima\u2192ditindaklanjuti\u2192selesai + tanggapan_admin; tracking publik tanpa identitas pelapor.',sSmall))
story.append(P('<b>7.5 Pajak Desa</b> \u2014 jenis (PBB/BPHTB/\u2026), wajib pajak (NIK/NPWPD), transaksi, setoran batch (draft\u2192dikonfirmasi), audit trail, ringkasan GET /api/pajak/ringkasan. <b>7.6 Berita</b> \u2014 judul, slug auto, LONGTEXT, kategori, cover, tags JSON, draft/terbit, filter publik, komentar (auth+moderasi), counter baca.',sSmall))
story.append(P('<b>7.7 Statistik &amp; Demografi</b> \u2014 lahir/meninggal/pindah/datang per tahun, tren multi-year (Recharts), komposisi gender/usia/pekerjaan, GET /api/statistik/penduduk. <b>7.8 Agenda</b> \u2014 tanggal, lokasi, penyelenggara, kategori. <b>7.9 Galeri</b> \u2014 album+item, AVIF/WebP. <b>7.10 UMKM</b> \u2014 profil, foto array, produk JSON, slug /umkm/{slug}. <b>7.11 Profil Desa</b> \u2014 singleton id=1: sejarah, visi-misi, perangkat_desa, dusun, potensi &amp; fasilitas.',sSmall))
story.append(P('<b>7.12 Notifikasi Realtime (SSE)</b> \u2014 GET /api/notifikasi/stream (auth), payload {id,judul,pesan,tipe,createdAt}, heartbeat 15s, hook useNotificationStream. <b>7.13 PWA</b> \u2014 public/sw.js (cache-first aset, network-first navigasi), manifest installable, tanpa push spam.',sSmall))

# 08 Skema Database
story.append(section_header('08','Skema Database'))
story.append(P('19+ tabel, PK <b>ULID CHAR(26)</b> (sortable, collision-resistant), engine <b>InnoDB</b>, charset <b>utf8mb4_unicode_ci</b>, kolom JSON (data_isian, tags, foto). FK, indeks idx_*, timestamp DATETIME CURRENT_TIMESTAMP.',sBody))
story.append(styled_table(['No','Tabel','Deskripsi','PK','FK Utama'],[['1','users','Akun warga &amp; admin','CHAR(26)','-'],['2','refresh_tokens','Refresh hash aktif','id','user_id \u2192 users'],['3','pending_registrations','Menunggu OTP','id','-'],['4','otp','Kode OTP','id','email lookup'],['5','jenis_surat','Master layanan','id','-'],['6','pengajuan_surat','Permohonan warga','id','user_id, jenis_surat_id'],['7','pengajuan_lampiran','File lampiran','id','pengajuan_id'],['8','pengajuan_riwayat_status','Audit trail','id','pengajuan_id'],['9','pengaduan','Aspirasi warga','id','user_id'],['10','berita','Artikel &amp; berita','id','author_id \u2192 users'],['11','profil_desa','Singleton profil','id=1','-'],['12','statistik_penduduk','Per tahun','id','-'],['13','apbdes_item','Pendapatan/belanja','id','-'],['14','agenda_kegiatan','Kalender','id','-'],['15','galeri_album','Album foto','id','-'],['16','galeri_item','Foto dalam album','id','album_id'],['17','umkm','Direktori UMKM','id','-'],['18','perangkat_desa','Struktur organisasi','id','-'],['19','dusun','Data dusun','id','-'],['20','potensi_desa','Potensi desa','id','-'],['21','fasilitas_desa','Fasilitas','id','-']],col_widths=[CW*0.06,CW*0.20,CW*0.30,CW*0.14,CW*0.30]))
story.append(Spacer(1,2*mm))
story.append(P('<b>Migrasi (golang-migrate):</b> 000001 initial \u2192 000006 security_cleanup \u2192 000007 seed_layanan_lengkap \u2192 000008 otp_email \u2192 000009 pending_registration \u2192 000010 expand_foto \u2192 000011 seed_persuratan \u2192 000012 dynamic_persuratan (form_fields JSON). <b>ponytail:</b> single-node MySQL sekarang; read-replica sebelum production multi-node \u2014 tanpa menunda rilis awal.',sSmall))

# 09 Keamanan
story.append(section_header('09','Model Keamanan'))
story.append(P('<b>9.1 Defense-in-Depth</b> \u2014 tiap lapisan independen; kegagalan satu tidak menjebol sistem.',sH2))
story.append(drawing_defense())
story.append(P('Gambar 5 \u2014 Enam lapisan pertahanan. Validasi selalu server-side; sqlc tanpa string-concat; upload via magic-byte + whitelist.',sCap))
story.append(styled_table(['Lapisan','Mekanisme'],[['Transport','HTTPS (prod), HTTP localhost (dev)'],['Autentikasi','JWT + refresh rotation + reuse detection'],['Otorisasi','RBAC warga/admin/super_admin'],['CSRF','Double-submit cookie (HttpOnly:false + header)'],['Rate Limiting','Per-IP token bucket; XFF hanya dari TRUSTED_PROXIES (CIDR)'],['Validasi Input','DisallowUnknownFields, validator v10'],['SQL Injection','sqlc parameterized, tanpa concat'],['XSS','CSP ketat, escaping template'],['File Upload','MIME sniff + magic-byte %PDF-, size 5 MB, whitelist jpg/jpeg/png/pdf/webp'],['Secret','env var, tidak hardcode; HMAC terpisah dari JWT'],['Password','bcrypt cost 12'],['Audit Trail','changed_by + timestamp di setiap perubahan status']],col_widths=[CW*0.24,CW*0.76]))
story.append(Spacer(1,2*mm))
story.append(P('<b>9.2 Security Headers (middleware Common)</b> \u2014 X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, X-Frame-Options DENY, Permissions-Policy (camera/mic/geolocation/payment=()), CSP default-src self; frame-ancestors none; base-uri self; HSTS 63072000 preload (prod+TLS).',sSmall))
story.append(P('<b>9.3 Audit Keamanan (Agustus 2026) \u2014 25 temuan, 100% fixed</b>',sH2))
story.append(chart_img(CS,58))
story.append(P('Gambar 6 \u2014 Distribusi severity &amp; status perbaikan. Kritis (webhook WA, MySQL loopback, JWT 24h\u219215m, HMAC terpisah, bcrypt 10\u219212) &amp; tinggi (CIDR limiter, JWT iss/aud/nbf, CSPRNG panic, Content-Disposition sanitasi, MIME octet-stream) \u2014 semua diverifikasi ulang.',sCap))
story.append(P('<b>Top 10 perbaikan:</b> 1) X-FlowKirim-Secret 2) MySQL 127.0.0.1:3306 3) JWT 15m 4) HMAC terpisah 5) bcrypt 12 6) XFF hanya TRUSTED_PROXIES 7) JWT iss/aud/nbf 8) CSPRNG gagal\u2192panic 9) Content-Disposition strip CRLF 10) octet-stream hanya jika .pdf + %PDF- magic.',sSmall))

# 10 Kinerja
story.append(section_header('10','Kinerja & Skalabilitas'))
story.append(P('<b>10.1 Benchmark Internal</b> \u2014 Docker 4-core/8 GB/SSD, 1 instance, steady-state (bukan burst).',sH2))
story.append(chart_img(CB,68))
story.append(P('Gambar 7 \u2014 Latency p50/p95 (batang) &amp; throughput (garis emas). Publik &lt;50 ms p95; login 145/280 ms (bcrypt); upload 220/450 ms (I/O). SSE 5.000 concurrent (event-driven).',sCap))
story.append(P('<b>10.2 Optimasi:</b> DB pool 25/10, indeks idx_*, Next.js Image AVIF/WebP, SSR/SSG publik + ISR berita, Service Worker stale-while-revalidate, in-memory SSR cache TTL pendek, worker pool 4 async (email/WA/PDF), gzip planned.',sSmall))
story.append(P('<b>10.3 Horizontal:</b> backend stateless \u2192 scale di belakang LB. Sessionless JWT+refresh di DB. Upload shared volume (NFS/S3/MinIO) siap migrasi. DB pool per instance. Target 1 instance \u2248500 concurrent, 3 instance \u22481.500. MySQL single-node awal, siap read-replica. <b>ponytail:</b> replikasi &amp; sharding ditunda sampai metrik production membenarkan biaya.',sSmall))

# 11 UX
story.append(section_header('11','Pengalaman Pengguna & PWA'))
story.append(P('<b>11.1 Desain Visual</b> \u2014 Tailwind 4 + design system terpusat (lib/utils/cn, components/ui), 25+ komponen, Lucide React, light/dark (Zustand), sans-serif modern, mobile-first. Kontras memenuhi WCAG AA.',sBody))
story.append(P('<b>11.2 i18n</b> \u2014 id.json &amp; en.json 100%, toggle header persist localStorage. <b>11.3 Aksesibilitas:</b> semantic HTML5, ARIA, kontras AA, keyboard penuh, skip-to-content. <b>11.4 PWA:</b> installable, cache aset &amp; halaman penting untuk offline/hemat data, splash manifest, tanpa push spam.',sBody))
story.append(P('<b>11.5 Lighthouse (production build simulasi)</b>',sH2))
story.append(styled_table(['Metrik','Skor / Nilai'],[['Performance','90+'],['Accessibility','95+'],['Best Practices','95+'],['SEO','100'],['First Contentful Paint','&lt; 1.5 s (4G)'],['Time to Interactive','&lt; 3 s']],col_widths=[CW*0.42,CW*0.58]))

# 12 Operasional
story.append(section_header('12','Operasional & Pemeliharaan'))
story.append(P('<b>12.1 Deployment</b> \u2014 <font face="Courier">cp .env.example .env \u2192 docker compose up --build -d</font>. Frontend 3300, backend 8088, mysql 127.0.0.1:3306 (loopback only). Production planned: Swarm/K8s, Nginx+TLS Let\u2019s Encrypt, MinIO, backup S3, Prometheus+Grafana, Loki/ELK.',sSmall))
story.append(styled_table(['Layanan','URL Internal','Port Host'],[['Frontend','http://localhost:3300','3300'],['Backend REST API','http://localhost:8088','8088'],['MySQL','127.0.0.1:3306','3306 loopback']],col_widths=[CW*0.30,CW*0.42,CW*0.28]))
story.append(Spacer(1,2*mm))
story.append(P('<b>12.2 Backup &amp; Restore</b> \u2014 <font face="Courier">bash Backend/scripts/backup.sh</font> \u2192 desa_borong_YYYYMMDD_HHMMSS.sql.gz, cron harian, retention 30 hari (BACKUP_RETENTION_DAYS), restore via docker compose exec -T mysql.',sSmall))
story.append(P('<b>12.3 Monitoring</b> \u2014 GET /healthz (liveness 200), GET /readyz (readiness cek MySQL, 503 jika down), slog JSON prod (method, path, duration, request_id), panic recovery + stack trace.',sSmall))
story.append(P('<b>12.4 Secret Rotation (tanpa downtime):</b> JWT_ACCESS_SECRET via previous_secret array (planned), DOCUMENT_HMAC_SECRET tidak dirotasi tanpa re-issue QR, DB password via env+restart.',sSmall))

# 13 CI/CD
story.append(section_header('13','Pipeline CI/CD'))
story.append(styled_table(['Job','Langkah Utama'],[['Backend','setup-go 1.26 \u2192 go mod download \u2192 MySQL service \u2192 go vet \u2192 go test \u2192 go test -race'],['Frontend','setup-node 22 \u2192 npm ci \u2192 tsc --noEmit \u2192 eslint \u2192 next build \u2192 vitest run'],['Docker','setup-buildx \u2192 build image desa-borong:latest \u2192 cache gha']],col_widths=[CW*0.18,CW*0.82]))
story.append(Spacer(1,2*mm))
story.append(P('<b>Definition of Done (tiap PR):</b> 1) go vet &amp; go test -race lulus 2) tsc+eslint+vitest lulus 3) docker build sukses 4) migrasi up/down ter-commit 5) endpoint baru ada handler+usecase test 6) perubahan transaksional punya audit trail.',sSmall))

# 14 Audit & Risiko
story.append(section_header('14','Hasil Audit & Mitigasi Risiko'))
story.append(styled_table(['Severity','Jumlah','Status'],[['Kritis','5','\u2713 Diperbaiki'],['Tinggi','5','\u2713 Diperbaiki'],['Sedang','7','\u2713 Diperbaiki'],['Rendah / Quality','8','\u2713 Diperbaiki'],['Total','25','100% selesai']],col_widths=[CW*0.36,CW*0.22,CW*0.42]))
story.append(Spacer(1,2*mm))
story.append(styled_table(['Risiko Residual','Mitigasi'],[['bcrypt 12 \u2192 latency login','Evaluasi argon2id bila traffic tinggi'],['Single MySQL','Read-replica sebelum production'],['Upload volume lokal','Migrasi MinIO/S3 sebelum multi-node'],['Tanpa WAF/DDoS','Cloudflare / AWS Shield di production'],['Rate limit per-IP','Tambah limit per user-ID untuk auth'],['Audit akses data sensitif','Middleware who-accessed-what (planned)']],col_widths=[CW*0.34,CW*0.66]))
story.append(Spacer(1,2*mm))
story.append(P('<b>Kepatuhan:</b> OWASP Top 10 (2021), UU PDP No.27/2022, PP 71/2019, Inpres 3/2003.',sSmall))

# 15 Roadmap
story.append(section_header('15','Roadmap Pengembangan'))
story.append(chart_img(CR,52))
story.append(P('Gambar 8 \u2014 Roadmap 4 fase. Awal (Q2-Q3 2026) selesai: Clean Arch, JWT+refresh, 13 modul, SSE, PWA, audit. Production (Q3 2026) fokus TLS, MinIO, backup cloud, observability, pelatihan.',sCap))
story.append(styled_table(['Fase','Periode','Fokus Utama'],[['Produksi Awal','Q2-Q3 2026','Go Clean Arch, Next.js SSR/SSG, JWT+refresh, 13 modul, SSE, PWA, audit 25 temuan'],['Deployment Production','Q3 2026','Nginx+TLS, domain, MinIO, backup S3, Prometheus+Grafana, pelatihan'],['Lanjutan','Q4 2026-2027','Dukcapil API, PSrE, pembayaran retribusi/pajak, refactor multi-tenant, RN app'],['Inovasi','2027+','AI chatbot prosedur, analytics dashboard, voice aksesibilitas, blockchain audit (eksplorasi)']],col_widths=[CW*0.22,CW*0.18,CW*0.60]))

# 16 Kesimpulan
story.append(section_header('16','Kesimpulan'))
story.append(P('Sistem Informasi Desa Borong membuktikan desa dapat memiliki platform operasional \u2014 bukan sekadar brosur \u2014 dengan standar produksi: performa &lt;50 ms publik, keamanan berlapis (OWASP/UU PDP/PP 71), skalabilitas horizontal stateless, maintainability via Clean Architecture, dan UX PWA aksesibel. 25 temuan \u2192 0, local Docker \u2192 siap global Q3 2026.',sBody))
story.append(P('Keberhasilan ini dirancang sebagai <b>model replikasi</b> bagi desa lain: satu desa per deployment, replikasi via Docker Compose, data terpublikasi &amp; terverifikasi QR. E-Government &amp; keterbukaan bukan jargon \u2014 melainkan endpoint yang bisa di-curl dan log yang bisa diaudit.',sBody))
story.append(Paragraph('<b>Prinsip yang dijaga:</b> boring over clever \u2022 deletion over addition \u2022 standar platform sebelum library \u2022 validasi di trust boundary \u2022 audit trail untuk setiap mutasi \u2014 kepercayaan publik dibangun dari jejak yang tidak bisa dihapus.',ParagraphStyle('concl',parent=sBody,backColor=GREEN_LIGHT,borderPadding=(6,8,6,8),textColor=GREEN_DARK,fontSize=7.5,leading=10)))

# 17 Lampiran
story.append(section_header('17','Lampiran'))
story.append(P('<b>Lampiran A \u2014 Endpoint API (Ringkasan)</b>',sH2))
story.append(styled_table(['Group','Method & Path','Auth','Deskripsi'],[['Auth','POST /api/auth/register','Publik','Registrasi + OTP'],['','POST /api/auth/verify-otp','Publik','Verifikasi OTP'],['','POST /api/auth/login','Publik','\u2192 access+refresh'],['','POST /api/auth/refresh','Refresh cookie','Rotasi token'],['','POST /api/auth/logout','Auth','Revoke token'],['','GET /api/auth/me','Auth','Profil login'],['','POST /api/auth/forgot-password','Publik','Kirim OTP reset'],['','POST /api/auth/reset-password','Publik','Reset via OTP'],['','POST /api/auth/change-password','Auth','Ganti password'],['Berita','GET /api/berita','Publik','List + filter'],['','GET /api/berita/{slug}','Publik','Detail'],['','GET /api/berita/{slug}/komentar','Publik','Komentar'],['','POST /api/berita/{slug}/komentar','Auth','Tambah komentar'],['','GET /api/admin/berita','Admin','Manajemen'],['','POST /api/berita','Admin','Create'],['','PUT /api/berita/{id}','Admin','Update'],['','DELETE /api/berita/{id}','Admin','Delete'],['Persuratan','GET /api/layanan','Publik','Daftar jenis'],['','GET /api/layanan/{kode}','Publik','Detail + form_fields'],['','POST /api/pengajuan','Auth+CSRF','Ajukan + upload'],['','GET /api/pengajuan/{resi}','Publik (RL)','Tracking'],['','GET /api/surat/{resi}','Publik (RL)','Download PDF'],['','GET /api/verifikasi/surat/{code}','Publik (RL)','Verifikasi QR'],['','GET /api/pengajuan/saya','Auth','Riwayat sendiri'],['','GET /api/admin/pengajuan','Admin','List semua'],['','PATCH /api/pengajuan/{id}/status','Admin','Ubah status'],['','POST /api/pengajuan/{id}/publish','Admin','Publish PDF+QR'],['Pengaduan','POST /api/pengaduan','Auth+CSRF','Buat pengaduan'],['','GET /api/pengaduan/{tiket}','Publik (RL)','Tracking'],['','GET /api/pengaduan/saya','Auth','Riwayat sendiri'],['','GET /api/admin/pengaduan','Admin','List semua'],['','PATCH /api/pengaduan/{id}/status','Admin','Ubah + tanggapan'],['Pajak','GET /api/pajak/ringkasan','Publik','Ringkasan transparansi'],['','GET /api/admin/pajak/*','Admin','CRUD pajak'],['Lainnya','GET /api/profil-desa, /statistik, /apbdes, /agenda, /galeri, /umkm, /notifikasi/stream','-','Publik/SSE']],col_widths=[CW*0.13,CW*0.34,CW*0.16,CW*0.37]))

story.append(P('<b>Lampiran B \u2014 Environment Variables (Backend)</b>',sH2))
story.append(styled_table(['Variable','Wajib','Default','Deskripsi'],[['APP_ENV','Ya','development','development / production'],['APP_PORT','Tidak','8080','Port backend'],['DB_HOST','Ya','localhost','Host MySQL'],['DB_PORT','Tidak','3306','Port MySQL'],['DB_NAME','Ya','-','Nama DB'],['DB_USER','Ya','-','User DB'],['DB_PASSWORD','Ya','-','Password DB'],['JWT_ACCESS_SECRET','Ya (\u226532)','-','Secret JWT access'],['JWT_REFRESH_SECRET','Ya (\u226532)','-','Secret refresh (boleh sama)'],['DOCUMENT_HMAC_SECRET','Ya (prod)','-','HMAC terpisah'],['JWT_ACCESS_TTL','Tidak','15m','TTL access'],['JWT_REFRESH_TTL','Tidak','720h','TTL refresh'],['CORS_ALLOWED_ORIGINS','Ya','-','Origin comma-separated'],['FILE_STORAGE_PATH','Tidak','./uploads','Path upload'],['BREVO_API_KEY','Tidak','(NOOP)','API Brevo'],['BREVO_FROM_EMAIL','Tidak','no-reply@desaborong.id','Email pengirim'],['FLOWKIRIM_API_KEY','Tidak','(NOOP)','API FlowKirim'],['FLOWKIRIM_BASE_URL','Tidak','api.flowkirim.com','Base URL'],['FLOWKIRIM_WEBHOOK_SECRET','Tidak','(no auth)','Secret webhook WA'],['BOOTSTRAP_SUPER_ADMIN_*','Tidak','-','Seed super admin (hapus setelah boot)'],['TRUSTED_PROXIES','Tidak','(no trust)','CIDR proxy XFF'],['OTP_TTL_MINUTES','Tidak','10','TTL OTP menit']],col_widths=[CW*0.24,CW*0.12,CW*0.16,CW*0.48]))

story.append(P('<b>Lampiran C \u2014 Struktur File Penting (Backend)</b>',sH2))
rows=[['Backend/cmd/api/main.go','Entrypoint, wiring'],['internal/domain/','Entity, error sentinel'],['internal/usecase/auth/service.go','537 baris \u2014 kompleks'],['internal/usecase/persuratan/','Inti surat online'],['internal/infrastructure/auth/','JWT service'],['internal/infrastructure/mysql/','Repository sqlc+manual'],['internal/delivery/http/router.go','180 baris \u2014 semua route'],['internal/delivery/http/middleware/','auth, csrf, rate_limit, common'],['migrations/*.sql','12 file up/down']]
t=Table([[P(f'<font face="Courier">{a}</font>',mono),P(b,sCell)] for a,b in rows],colWidths=[CW*0.38,CW*0.62])
t.setStyle(TableStyle([('GRID',(0,0),(-1,-1),0.4,HexColor('#E5E7EB')),('BACKGROUND',(0,0),(0,-1),GREY_50),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('TOPPADDING',(0,0),(-1,-1),3),('BOTTOMPADDING',(0,0),(-1,-1),3),('LEFTPADDING',(0,0),(-1,-1),5)]))
story.append(t)

story.append(P('<b>Lampiran D \u2014 Dependensi Utama</b>',sH2))
story.append(Table([[P('<b>Backend (go.mod)</b>',ParagraphStyle('dh',parent=sHead,textColor=GREEN_DARK,fontSize=6.6)),P('<b>Frontend (package.json)</b>',ParagraphStyle('dh2',parent=sHead,textColor=NAVY,fontSize=6.6))],[P('github.com/go-sql-driver/mysql<br/>github.com/golang-jwt/jwt/v5<br/>github.com/golang-migrate/migrate/v4<br/>github.com/oklog/ulid/v2<br/>github.com/stretchr/testify<br/>golang.org/x/crypto<br/>github.com/sqlc-dev/sqlc (tool)',ParagraphStyle('dep',parent=sCell,fontName='Courier',fontSize=5.8,leading=6.8)),P('next@^16, react@^19, typescript@^5<br/>tailwindcss@^4, zustand@^5, zod@^3<br/>recharts@^2, leaflet, lucide-react<br/>sharp@0.35.3, vitest@^3, testing-library',ParagraphStyle('dep2',parent=sCell,fontName='Courier',fontSize=5.8,leading=6.8))]],colWidths=[CW/2,CW/2]))
story[-1].setStyle(TableStyle([('GRID',(0,0),(-1,-1),0.4,HexColor('#E5E7EB')),('BACKGROUND',(0,0),(-1,0),GREY_100),('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),('LEFTPADDING',(0,0),(-1,-1),5)]))
story.append(Spacer(1,4*mm))
story.append(P('Dokumen disiapkan 21 Agustus 2026 sebagai white paper resmi. Konten publik, dapat disitasi non-komersial dengan atribusi. <b>\u00a9 2026 Pemerintah Desa Borong. MIT untuk kode sumber.</b>',ParagraphStyle('final',parent=sBody,alignment=TA_CENTER,textColor=GREY_500,fontSize=6.8,leading=9,backColor=GREY_50,borderPadding=(6,8,6,8))))

doc.build(story,onFirstPage=hf,onLaterPages=hf)
import os as _os; print(f"done \u2192 {OUT} ({_os.path.getsize(OUT)} bytes) CW={CW:.1f}")

package pdfengine

import (
	"encoding/base64"
	"fmt"
	"strings"
)

// HTMLToPDFDataURL converts HTML content string into a clean, valid PDF Data URL.
func HTMLToPDFDataURL(htmlContent string, title string) (string, []byte) {
	lines := extractTextLines(htmlContent)
	if len(lines) == 0 {
		lines = []string{"PEMERINTAH DESA ANABANUA", "SURAT KETERANGAN RESMI", title}
	}

	var content strings.Builder
	// Set Font
	content.WriteString("BT /F1 10 Tf 50 780 Td\n")

	for i, line := range lines {
		if i > 35 {
			break // Max 35 lines per page for standard PDF stream
		}
		// Escape PDF special characters
		escapedLine := pdfEscape(line)
		if strings.HasPrefix(line, "PEMERINTAH") || strings.HasPrefix(line, "SURAT") {
			fmt.Fprintf(&content, "ET BT /F1 13 Tf 50 %d Td (%s) Tj\n", 780-i*20, escapedLine)
		} else {
			fmt.Fprintf(&content, "ET BT /F1 10 Tf 50 %d Td (%s) Tj\n", 780-i*20, escapedLine)
		}
	}
	content.WriteString("ET\n")

	objs := []string{
		"<< /Type /Catalog /Pages 2 0 R >>",
		"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
		"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
		"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
		fmt.Sprintf("<< /Length %d >>\nstream\n%s\nendstream", content.Len(), content.String()),
	}

	var pdfBuilder strings.Builder
	pdfBuilder.WriteString("%PDF-1.4\n")
	offsets := []int{0}

	for i, obj := range objs {
		offsets = append(offsets, pdfBuilder.Len())
		fmt.Fprintf(&pdfBuilder, "%d 0 obj\n%s\nendobj\n", i+1, obj)
	}

	xrefPos := pdfBuilder.Len()
	fmt.Fprintf(&pdfBuilder, "xref\n0 %d\n0000000000 65535 f \n", len(objs)+1)
	for _, off := range offsets[1:] {
		fmt.Fprintf(&pdfBuilder, "%010d 00000 n \n", off)
	}
	fmt.Fprintf(&pdfBuilder, "trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF", len(objs)+1, xrefPos)

	pdfBytes := []byte(pdfBuilder.String())
	dataURL := "data:application/pdf;base64," + base64.StdEncoding.EncodeToString(pdfBytes)
	return dataURL, pdfBytes
}

func extractTextLines(htmlStr string) []string {
	// Strip basic HTML tags to extract raw printable lines
	r := strings.NewReplacer(
		"<br>", "\n", "<br/>", "\n", "<br />", "\n",
		"</p>", "\n", "</div>", "\n", "</tr>", "\n",
		"</td>", "  ", "<th>", "  ", "</th>", "  ",
		"<strong>", "", "</strong>", "", "<em>", "", "</em>", "",
		"<u>", "", "</u>", "", "<h4>", "\n", "</h4>", "\n",
		"<h3>", "\n", "</h3>", "\n", "<h2>", "\n", "2>", "\n",
	)
	cleanStr := r.Replace(htmlStr)

	// Remove remaining HTML tags
	inTag := false
	var buf strings.Builder
	for _, ch := range cleanStr {
		if ch == '<' {
			inTag = true
			continue
		}
		if ch == '>' {
			inTag = false
			continue
		}
		if !inTag {
			buf.WriteRune(ch)
		}
	}

	rawLines := strings.Split(buf.String(), "\n")
	var result []string
	for _, l := range rawLines {
		trimmed := strings.TrimSpace(l)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

func pdfEscape(in string) string {
	r := strings.NewReplacer("\\", "\\\\", "(", "\\(", ")", "\\)")
	out := r.Replace(in)
	var b strings.Builder
	for _, c := range out {
		if c >= 0x20 && c <= 0x7E {
			b.WriteRune(c)
		} else {
			b.WriteByte(' ')
		}
	}
	return b.String()
}

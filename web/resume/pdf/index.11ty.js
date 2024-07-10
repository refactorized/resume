const port = process?.env?.PORT || 3927

class pdfList {
  data() {
    return {
      permalink: '/pdf/pdf.json',
    }
  }

  render({ collections }) {
    const urls = (collections.pdf || []).map((pg) => pg.url)
    return JSON.stringify(urls)
  }
}

export default pdfList

import mdattrs from 'markdown-it-attrs'
import mdsub from 'markdown-it-sub'
import { EleventyRenderPlugin } from '@11ty/eleventy'
import yaml from 'js-yaml'

import pages from './src/shortcodes/pages.js'
import json from './src/shortcodes/json.js'

import pluginWebc from '@11ty/eleventy-plugin-webc'

export default function (eleventyConfig) {
  // Filters and shortcodes // ------------------------------------------------
  //   splits md by HRs and wraps in .page divs
  eleventyConfig.addPairedShortcode('pages', pages)
  //   easy safe stringify data
  eleventyConfig.addFilter('json', json)
  //   add render shortcode
  eleventyConfig.addPlugin(EleventyRenderPlugin)
  // --------------------------------------------------------------------------

  // simple css copy for now
  eleventyConfig.addPassthroughCopy('web/style/*.css')

  // webc support
  eleventyConfig.addPlugin(pluginWebc, {})

  // add md plugins
  eleventyConfig.amendLibrary('md', (mdLib) => {
    mdLib.use(mdattrs) // general attributes support
    mdLib.use(mdsub) // subscript support
  })

  // use yaml files in data cascade
  eleventyConfig.addDataExtension('yaml', ($c) => yaml.load($c))
  return {
    dir: {
      input: 'web',
    },
  }
}

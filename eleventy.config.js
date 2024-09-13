import mdattrs from 'markdown-it-attrs'
import mdsub from 'markdown-it-sub'
import { EleventyRenderPlugin } from '@11ty/eleventy'
import yaml from 'js-yaml'

import pages from './src/transforms/pages.js'
import json from './src/transforms/json.js'
import getChunk from './src/transforms/getChunk.js'

import pluginWebc from '@11ty/eleventy-plugin-webc'

export default function (eleventyConfig) {
  // splits md by HRs and wraps in .page divs
  eleventyConfig.addFilter('pages', pages)

  // easy safe stringify data
  eleventyConfig.addFilter('json', json)

  // splits on a token (default: '\n---\n') and returns specific chunk
  eleventyConfig.addFilter('getChunk', getChunk)

  // webc support
  eleventyConfig.addPlugin(pluginWebc, {
    components: ['**/components/**/*.webc'],
  })

  // add render shortcode
  eleventyConfig.addPlugin(EleventyRenderPlugin)

  // simple css copy for now
  eleventyConfig.addPassthroughCopy('web/style/*.css')

  // add md plugins
  eleventyConfig.amendLibrary('md', (mdLib) => {
    mdLib.use(mdattrs) // general attributes support
    mdLib.use(mdsub) // subscript support
  })

  // use yaml files in data cascade
  eleventyConfig.addDataExtension('yaml', ($c) => yaml.load($c))

  // alternate content root
  return {
    dir: {
      input: 'web',
    },
  }
}

import mdattrs from 'markdown-it-attrs'
import mdsub from 'markdown-it-sub'
import { EleventyRenderPlugin } from '@11ty/eleventy'

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(EleventyRenderPlugin)
  eleventyConfig.ignores.add('parts')

  eleventyConfig.addPassthroughCopy('web/style/*.css')
  eleventyConfig.amendLibrary('md', (mdLib) => {
    mdLib.use(mdattrs)
    mdLib.use(mdsub)
  })
  return {
    dir: {
      input: 'web',
    },
  }
}

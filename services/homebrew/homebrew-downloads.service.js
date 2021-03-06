'use strict'

const Joi = require('joi')
const { downloadCount } = require('../color-formatters')
const { metric } = require('../text-formatters')
const { BaseJsonService } = require('..')
const { nonNegativeInteger } = require('../validators')

function getSchema({ formula }) {
  return Joi.object({
    analytics: Joi.object({
      install: Joi.object({
        '30d': Joi.object({ [formula]: nonNegativeInteger }).required(),
        '90d': Joi.object({ [formula]: nonNegativeInteger }).required(),
        '365d': Joi.object({ [formula]: nonNegativeInteger }).required(),
      }).required(),
    }).required(),
  }).required()
}

const periodMap = {
  dm: {
    api_field: '30d',
    suffix: '/month',
  },
  dq: {
    api_field: '90d',
    suffix: '/quarter',
  },
  dy: {
    api_field: '365d',
    suffix: '/year',
  },
}

module.exports = class HomebrewDownloads extends BaseJsonService {
  static category = 'downloads'

  static route = {
    base: 'homebrew',
    pattern: 'installs/:interval(dm|dq|dy)/:formula',
  }

  static examples = [
    {
      title: 'homebrew downloads',
      namedParams: { interval: 'dm', formula: 'cake' },
      staticPreview: this.render({ interval: 'dm', downloads: 93 }),
    },
  ]

  static defaultBadgeData = { label: 'downloads' }

  static render({ interval, downloads }) {
    return {
      message: `${metric(downloads)}${periodMap[interval].suffix}`,
      color: downloadCount(downloads),
    }
  }

  async fetch({ formula }) {
    const schema = getSchema({ formula })
    return this._requestJson({
      schema,
      url: `https://formulae.brew.sh/api/formula/${formula}.json`,
      errorMessages: { 404: 'formula not found' },
    })
  }

  async handle({ interval, formula }) {
    const data = await this.fetch({ formula })
    return this.constructor.render({
      interval,
      downloads: data.analytics.install[periodMap[interval].api_field][formula],
    })
  }
}

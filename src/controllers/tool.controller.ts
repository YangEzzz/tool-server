import { Context } from 'koa';
import * as cheerio from "cheerio"
import { ResponseCode } from '@/types/response';
import logger from '@/utils/logger';
import axios from 'axios';

export interface NewsItem {
  id: string | number // unique
  title: string
  url: string
  mobileUrl?: string
  pubDate?: number | string
  extra?: {
    desc?: string
    date?: number | string
    star?: false | string
    codeLang?: string
    codeColor?: string
    fork?: string
    todayStar?: string
  }
}

const trending = async (since: string) => {
  const baseURL = "https://github.com"
  let html: any
  try {
     html = await axios.get(`https://github.com/trending?since=${since}`)
    if(html?.data) {
      html = html.data
    }
  } catch (error) {
    logger.error('获取失败:', error);
  }
  const $ = cheerio.load(html?.data || html)
  const $main = $("main .Box div[data-hpc] > article")
  const news: NewsItem[] = []
  $main.each((_, el) => {
    const a = $(el).find(">h2 a")
    const title = a.text().replace(/\n+/g, "").trim()
    const url = a.attr("href")
    const star = $(el).find("[href$=stargazers]").text().replace(/\s+/g, "").trim()
    const fork = $(el).find("[href$=forks]").text().replace(/\s+/g, "").trim()
    const todayStar = $(el).find(".d-inline-block.float-sm-right").text().replace(/stars today/g, "").trim()
    const codeColor = $(el).find(".repo-language-color").attr('style')?.split(';')
      .map(s => s.trim())
      .find(s => s.startsWith('background-color'))
      ?.split(':')[1]
      ?.trim()
    const codeLang = $(el).find("[itemprop$=programmingLanguage]").text().replace(/\s+/g, "").trim()
    const desc = $(el).find(">p").text().replace(/\n+/g, "").trim()
    if (url && title) {
      news.push({
        url: `${baseURL}${url}`,
        title,
        id: url,
        extra: {
          star,
          desc,
          fork,
          codeLang,
          codeColor,
          todayStar
        },
      })
    }
  })
  return news
}

// 角色控制器
export const getTrendingList = async (ctx: Context) => {
  const startTime = Date.now();
  try {
    const list = await trending(ctx?.query?.since as string || "daily");
    ctx.status = 200;
    ctx.body = {
      success: true,
      code: ResponseCode.SUCCESS,
      data: list,
      message: '获取成功'
    };

    const totalTime = Date.now() - startTime;
    logger.info(`getTrendingList处理完成，总耗时: ${totalTime}ms`);
  } catch (error) {
    logger.error('获取失败:', error);
    ctx.status = 200;
    ctx.body = {
      success: false,
      code: ResponseCode.INTERNAL_ERROR,
      message: '获取失败'
    };

    const totalTime = Date.now() - startTime;
    logger.info(`getTrendingList处理失败，总耗时: ${totalTime}ms`);
  }
};

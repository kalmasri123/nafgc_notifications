const { TwitterApi } = require('twitter-api-v2');
const dotenv = require('dotenv')
const { Webhook } = require('discord-webhook-node');
dotenv.config()


const { createClient } = require('redis');

const client = createClient();

client.on('error', (err) => console.log('Redis Client Error', err));
client.connect();

const hook = new Webhook(process.env.WEBHOOK_URL)
const appOnlyClient = new TwitterApi(process.env.BEARER_TOKEN_TWITTER)

async function checkTweets() {
    const user = await appOnlyClient.v2.userByUsername("NAFGCTO")
    const timeline = await appOnlyClient.v2.userTimeline(user.data.id, { max_results: 5 })
    const mostRecentTweet = await (await timeline.fetchNext()).data.data[0]
    const fullTweet = await appOnlyClient.v2.singleTweet(mostRecentTweet.id, { "tweet.fields": ["author_id", "referenced_tweets", "created_at"] })
    console.log(fullTweet)
    if(fullTweet.data.referenced_tweets) return;
    const mostRecent = await client.get("MOST_RECENT_TWEET")
    const createdAt = new Date(fullTweet.data.created_at);
    if(mostRecent && createdAt.getTime() <= mostRecent) return;
    await client.set("MOST_RECENT_TWEET",createdAt.getTime())

    await hook.send(`https://twitter.com/NAFGCTO/status/${fullTweet.data.id}`)

}



setInterval(checkTweets, 2000)

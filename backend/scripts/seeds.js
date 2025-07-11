//TODO: seeds script should come here, so we'll be able to put some data in our local env
require('dotenv').config();
const mongoose = require('mongoose')
const { faker } = require('@faker-js/faker')

require('../models/User');
require('../models/Item');
require('../models/Comment');

const User = mongoose.model('User');
const Item = mongoose.model('Item');
const Comment = mongoose.model('Comment');

const DEFAULT_PASSWORD = 'password123';
const SEED_COUNT = 100;

async function seedDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('Connected to mongodb')

        let users = []
        for (let i = 0; i < SEED_COUNT; i++){
            const user = new User({
                username: faker.internet.userName().toLowerCase().replace(/[^a-z0-9]/g, ''),
                email: faker.internet.email().toLowerCase(),
                bio: faker.lorem.sentence(),
                image: faker.image.avatar(),
                role: i === 0 ? 'admin' : 'user'
            });
            user.setPassword(DEFAULT_PASSWORD)
            users.push(user)
        }
        const createdUsers = await User.insertMany(users)
        console.log(`Created ${createdUsers.length} users`)

        let items = []
        for (let i = 0; i < SEED_COUNT; i++) {
            const seller = createdUsers[Math.floor(Math.random() * createdUsers.length)]
            const item = new Item({
                title: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                image: faker.image.imageUrl(640, 480, 'product', true),
                tagList: Array.from({ length: 3}, () => faker.commerce.department()),
                seller: seller._id
            })
            items.push(item)
        }
        const createdItems = await Item.insertMany(items)
        console.log(`Created ${createdItems.length} items`)

        let comments = []
        for (let i = 0; i < SEED_COUNT; i++) {
            const seller = createdUsers[Math.floor(Math.random() * createdUsers.length)]
            const item = createdItems[Math.floor(Math.random() * createdItems.length)]

            comments.push({
                body: faker.lorem.paragraph(),
                seller: seller._id,
                item: item._id
            })
        }
        const createdComments = await Comment.insertMany(comments)
        console.log(`Created ${createdComments.length} comments`)

        for (const user of createdUsers) {
            const favorites = createdItems
                .sort(() => 0.5 - Math.random())
                .slice(0, Math.floor(Math.random() * 10))
                .map(item => item._id)

            user.favorites = favorites
            await user.save()

            const following = createdUsers
                .filter(u => !u._id.equals(user._id))
                .sort(() => 0.5 - Math.random())
                .slice(0, Math.floor(Math.random() * 5))
                .map(u => u._id)

            user.following = following
            await user.save()
        }

        for (const item of createdItems) {
            await item.updateFavoriteCount()
        }

        console.log('Database seeding completed succesfully')
        process.exit(0)
    } catch(error) {
        console.error('Error seeding database:', error)
        process.exit(1)
    }
}

seedDatabase()

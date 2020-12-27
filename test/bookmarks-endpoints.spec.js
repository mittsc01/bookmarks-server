const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const supertest = require('supertest')
const { set } = require('../src/app')
const { makeBookmarksArray } = require('./bookmarks.fixtures')
const faker = require('faker')
const BookmarksService = require('../src/bookmarks/bookmarks-service')

describe('Bookmarks Endpoints', function () {

    let db
    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL
        })
        app.set('db', db)
    })
    after('disconnect from db', () => db.destroy())

    beforeEach('clean the table', () => db('bookmarks').truncate())

    context('Given there are bookmarks in the database', () => {

        const testBookmarks = makeBookmarksArray()
        beforeEach('insert bookmarks', () => {
            return db
                .into('bookmarks')
                .insert(testBookmarks.map(item => {
                    const newItem = {
                        ...item,

                    }
                    delete newItem.id
                    return newItem
                }))
        })
        it('GET /api/bookmarks responds with 200 and all of the bookmarks', () => {

            return supertest(app)

                .get('/api/bookmarks')
                .set("Authorization", `bearer ${process.env.API_TOKEN}`)
                .expect(200, testBookmarks)


        })
        it('GET /api/bookmarks/:id responds with 200 and the correct bookmark', () => {
            return supertest(app)
                .get('/api/bookmarks/3')
                .set("Authorization", `bearer ${process.env.API_TOKEN}`)
                .expect(200, testBookmarks[2])
        })

    })
    context('Given there are no bookmarks in the database', () => {
        it('GET /api/bookmarks responds with 200 and an empty list', () => {
            return supertest(app)
                .get('/api/bookmarks')
                .set("Authorization", `bearer ${process.env.API_TOKEN}`)
                .expect(200, [])
        })
        it('GET /api/bookmarks/:id responds with 404 and "bookmark not found"', () => {
            return supertest(app)
                .get('/api/bookmarks/1')
                .set('Authorization', `bearer ${process.env.API_TOKEN}`)
                .expect(404, {
                    error: {
                        message: `Bookmark doesn't exist`
                    }
                })
        })



    })
    describe(`POST /api/bookmarks`, () => {
        it(`creates an bookmark, responding with 201 and the new bookmark`, function () {

            const newBookmark = {
                title: 'Test new bookmark',
                url: 'http://test.com',
                description: 'Test new bookmark content...',
                rating: 4
            }
            return supertest(app)
                .post('/api/bookmarks')
                .send(newBookmark)
                .set("Authorization", `bearer ${process.env.API_TOKEN}`)

                .expect(201)
                .expect(res => {

                    expect(res.body.title).to.eql(newBookmark.title)
                    expect(res.body.url).to.eql(newBookmark.url)
                    expect(res.body.description).to.eql(newBookmark.description)
                    expect(res.body.rating).to.eql(newBookmark.rating)
                    expect(res.body).to.have.property('id')
                    console.log(res.headers.location)
                    expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`)

                })
                .then(postRes => {

                    return supertest(app)
                        .get(`/api/bookmarks/${postRes.body.id}`)
                        .set("Authorization", `bearer ${process.env.API_TOKEN}`)
                        .expect(postRes.body)

                }

                )

        })

        it('responds with 400 and error when title is missing', () => {
            const missingTitle = {
                url: faker.internet.url(),
                description: faker.lorem.sentence(),
                rating: 4
            }
            return supertest(app)
                .post('/api/bookmarks')
                .send(missingTitle)
                .set('Authorization', `bearer ${process.env.API_TOKEN}`)

                .expect(400, {
                    error: {
                        message: 'Missing title in request.'
                    }
                })
        })
        it('responds with 400 and error when url is missing', () => {
            const missingUrl = {
                title: faker.internet.domainName(),
                description: faker.lorem.sentence(),
                rating: 1
            }
            return supertest(app)
                .post('/api/bookmarks')
                .send(missingUrl)
                .set('Authorization', `bearer ${process.env.API_TOKEN}`)

                .expect(400, {
                    error: {
                        message: 'Missing url in request.'
                    }
                })
        })

        it('responds with 400 and error when rating is missing', () => {
            const missingRating = {
                url: faker.internet.url(),
                description: faker.lorem.sentence(),
                title: faker.internet.domainName()
            }
            return supertest(app)
                .post('/api/bookmarks')
                .send(missingRating)
                .set('Authorization', `bearer ${process.env.API_TOKEN}`)

                .expect(400, {
                    error: {
                        message: 'Missing rating in request.'
                    }
                })
        })

        it('responds with 400 and error when rating is not a number', () => {
            const invalidRating = {
                url: faker.internet.url(),
                description: faker.lorem.sentence(),
                title: faker.internet.domainName(),
                rating: 'twen'
            }
            return supertest(app)
                .post('/api/bookmarks')
                .send(invalidRating)
                .set('Authorization', `bearer ${process.env.API_TOKEN}`)
                .expect(400, {
                    error: {
                        message: 'Invalid rating in request.'
                    }
                })
        })

        it('responds with 400 and error when rating is not a number between 1 and 5', () => {
            const invalidRating = {
                url: faker.internet.url(),
                description: faker.lorem.sentence(),
                title: faker.internet.domainName(),
                rating: 22
            }
            return supertest(app)
                .post('/api/bookmarks')
                .send(invalidRating)
                .set('Authorization', `bearer ${process.env.API_TOKEN}`)
                .expect(400, {
                    error: {
                        message: 'Invalid rating in request.'
                    }
                })
        })
    })
    describe(`DELETE /api/bookmarks/:bookmark_id`, () => {
        const testBookmarks = makeBookmarksArray()
        beforeEach('insert bookmarks', () => {
            return db
                .into('bookmarks')
                .insert(testBookmarks)
        })
        it('responds with 204 and deletes bookmark from database', () => {
            const indexToDelete = 2;
            const expectedBookmarks = testBookmarks.filter(item => item.id != indexToDelete)
            return supertest(app)
                .delete(`/api/bookmarks/${indexToDelete}`)
                .set('Authorization', `bearer ${process.env.API_TOKEN}`)
                .expect(204)
                .then(res => {
                    return supertest(app)
                        .get(`/api/bookmarks`)
                        .set(`Authorization`, `bearer ${process.env.API_TOKEN}`)
                        .expect(expectedBookmarks)
                })

        })
        it('responds with 404 and error message if no bookmark with req id', () => {
            const indexToDelete = 22
            return supertest(app)
                .delete(`/api/bookmarks/${indexToDelete}`)
                .set('Authorization', `bearer ${process.env.API_TOKEN}`)
                .expect(404, { error: { message: `Bookmark doesn't exist` } })
        })
    })

    describe.only(`PATCH /api/bookmarks/:bookmark_id`, () => {
        const testBookmarks = makeBookmarksArray()
        beforeEach('insert bookmarks', () => {
            return db
                .into('bookmarks')
                .insert(testBookmarks)
        })
        it('responds with 404', () => {
            const id = 26
            return supertest(app)
                .patch(`/api/bookmarks/${id}`)
                .set('Authorization', `bearer ${process.env.API_TOKEN}`)
                .expect(404, {
                    error: {
                        message: `Bookmark doesn't exist`
                    }
                })

        })
        it('responds with 204 and updates bookmark', () => {
            const idToPatch = 2;
            const updatedBookmark = {
                title: faker.internet.domainName(),
                url: faker.internet.url(),
                description: faker.lorem.sentence(),
                rating: Math.ceil(Math.random() * 5)
            }
            const expectedBookmark = {
                ...testBookmarks[idToPatch - 1],
                ...updatedBookmark
            }
            return supertest(app)
                .patch(`/api/bookmarks/${idToPatch}`)
                .set('Authorization', `bearer ${process.env.API_TOKEN}`)
                .send(updatedBookmark)
                .expect(204)
                .then(res => {
                    return supertest(app)
                        .get(`/api/bookmarks/${idToPatch}`)
                        .set('Authorization', `bearer ${process.env.API_TOKEN}`)
                        .expect(expectedBookmark)

                })

        })
        it('responds with 400 when no valid fields supplied', () => {
            const idToUpdate = 2


            return supertest(app)
                .patch(`/api/bookmarks/${idToUpdate}`)
                .set('Authorization', `bearer ${process.env.API_TOKEN}`)
                .send({ irrelevant: 'here' })
                .expect(400, {
                    error: {
                        message: `Request body must contain one of the following: 'title', 'description', 'url' or 'rating'`
                    }
                })
        })
        it(`responds with 204 when updating only a nonempty subset of fields`, () => {
            const idToUpdate = 2
            const updateBookmark = {
                title: 'updated bookmark title',
            }
            const expectedBookmark = {
                ...testBookmarks[idToUpdate - 1],
                ...updateBookmark
            }

            return supertest(app)
                .patch(`/api/bookmarks/${idToUpdate}`)
                .set('Authorization', `bearer ${process.env.API_TOKEN}`)
                .send({
                    ...updateBookmark,
                    fieldToIgnore: 'should not be in GET response'
                })
                .expect(204)
                .then(res =>
                    supertest(app)
                        .get(`/api/bookmarks/${idToUpdate}`)
                        .set('Authorization', `bearer ${process.env.API_TOKEN}`)
                        .expect(expectedBookmark)
                )
        })
    })
})

const path = require('path')
const express = require('express')
const BookmarksService = require('./bookmarks-service')

const bookmarksRouter = express.Router()
const jsonParser = express.json()

function validRating(number) {
    const newNumber = parseFloat(number)
    if (isNaN(newNumber)) {
        return false
    }
    else if (newNumber < 1 || newNumber > 5) {
        return false
    }
    return true
}

bookmarksRouter
    .route('/')
    .get((req, res, next) => {
        BookmarksService.getAllBookmarks(
            req.app.get('db')
        )
            .then(bookmarks => {
                res.json(bookmarks)
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const { title, url, description, rating } = req.body
        const newBookmark = { title, url, rating }

        for (const [key, value] of Object.entries(newBookmark)) {
            if (value == null) {
                return res.status(400).json({
                    error: { message: `Missing ${key} in request.` }
                })
            }
        }
        if (!validRating(rating)) {
            return res.status(400).json({
                error: { message: `Invalid rating in request.` }
            })
        }
        newBookmark.description = description
        BookmarksService.insertBookmark(
            req.app.get('db'),
            newBookmark

        )
            .then(bookmark => {
                res
                    .status(201)
                    .location(`/api/bookmarks/${bookmark.id}`)
                    .json(bookmark)
            })
            .catch(next)



    })

bookmarksRouter
    .route('/:bookmark_id')
    .all((req, res, next) => {
        const knexInstance = req.app.get('db')
        BookmarksService.getById(knexInstance, req.params.bookmark_id)
            .then(bookmark => {
                if (!bookmark) {
                    return res.status(404).json({
                        error: {
                            message: `Bookmark doesn't exist`
                        }
                    })
                }
                res.bookmark = bookmark
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json({
            ...res.bookmark
        })
    })
    .delete((req, res, next) => {

        BookmarksService.deleteBookmark(req.app.get('db'), req.params.bookmark_id)
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch((req, res, next) => {
        const { title, url, description, rating } = req.body
        const updatedBookmark = { title, url, description, rating }
        const numberOfValues = Object.values(updatedBookmark).filter(Boolean).length
        if (numberOfValues === 0) {
            return res.status(400).json({
                error: {
                    message: `Request body must contain one of the following: 'title', 'description', 'url' or 'rating'`
                }
            })
        }
        BookmarksService.updateBookmark(req.app.get('db'), req.params.bookmark_id, updatedBookmark)
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = bookmarksRouter
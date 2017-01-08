# fenrir
## Contributing
You want to contribute? Fantastic!! This project can only succeed, if we all work together and bring it one step forward.
You don't know where to start? No Problem. Head to the issues and grab you one.
Decide where to start: 
#### Bugs
This project doesn't have bugs, it has features
#### Bad Features
If you encounter a bad feature, that should work any other way, mark your commit headline with \[B\] at the beginning.
#### New Features
If you have an idea for a cool new feature, mark your commit headline with \[F\] at the beginning.
#### Improving Features
If you improve something with your commit, mark your commit headline with \[I\] at the beginning.

If your commit is connected to an issue, reference it after the initial mark at the beginning of the commit headline with \[\#issue number\]

Sample commit headline:

`[F][#123] Implement HTCPCP`
### Code structure
Keep the code organized in suitable classes and keep them at a reasonable size. Two classes with 500 lines of code
don't hurt, one with 1000 lines does.

### Tests
Write tests for your function. The project has a 100% coverage in `/src`. This is awesome and should stay that way.
You can always check the coverage with `npm run coverage`. After that, the coverage report resides in `/coverage/lcov-report`.
Open index.html and check, if your code is fully covered with tests.

### Code style
The code style is pretty good handled by eslint. Just run `npm run lint` and as long as there are no errors, you should be fine.
 
However some additional style rules everybody should stick to to make the code readable:
 1. no unnecessary blank lines: Keep the code compact and readable. Blank lines in the middle of the code makes it unreadable
 2. We really like ternary operators ;) But don't extend them over multiple lines. Do an if statement instead.
 3. Document your code. This codebase has an excellent JSDoc documentation and we want to keep it that way. Tell other people,
 what your functions, classes etc. do. Run `npm run jsdoc` after that to update the JSDoc.
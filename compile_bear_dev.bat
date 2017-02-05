SET SCRIPT_NAME="dev.d3.user.js"
SET SRC_PATH="d:\_my_docs\d3\dirty-on-steroids\result\"%SCRIPT_NAME%

php build/d3merge.php %1 %2 %3
copy /Y  %SRC_PATH% "c:\Program Files\Opera\userscripts\"
copy /Y %SRC_PATH% "v:\"
START https://freedcamp.bear.com:8443/%SCRIPT_NAME%
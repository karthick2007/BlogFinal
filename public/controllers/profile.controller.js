
angular.module('app')
    .controller('profileCtrl',function($http,$scope,User){
        //var user = user.username;
        var Data;
        var i=0;
        var filename1=[];
        $scope.imagePresent = false;
        $scope.imageNotPresent = false;
        //console.log(User);

        refresh = function (){
            $http.get('/images')
                .then(function(response){
                    console.log(response.data);
                    if(response!=false){
                        Data = response.data.files;
                        angular.forEach(Data,function(value,key){
                            if(value.metadata.username == User) {
                                filename1[i] = value.filename;
                                i++;
                            }
                        })
                        //console.log(filename1);
                        $scope.filenames = filename1;
                        $scope.imagePresent = true;
                    }else{
                        $scope.imageNotPresent = true;
                    }
                })
                .catch(function(data){
                    $scope.imageNotPresent = true;
                })

        }
        refresh();
    })
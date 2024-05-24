API 명세서


기능                  URl                 Method          request                                                                      response

사용자 회원가입      api/sign-up            post            {                                                                             { 회원가입 완료}
                                                        	"id": "test1",                                                              
                                                          "email": "test1@naver.com",
                                                          "password": "0000",
                                                          "name": "이용우2",
                                                          "age": 30,
                                                          "gender": "MALE",
                                                          "profileImage": "https://prismalens.vercel.app/header/logo-dark.svg"
                                                        }
  
사용자 로그인       api/login              get              {                                                                              {로그인 완료}
                                                          	"id": "test1",
                                                          	"password": "0000"
                                                        }



